from datetime import UTC, datetime

from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import AllowAny, BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from .models import Talons
from .serializers import TalonsSerializer


class IsAdminOrRepresentativeForTalon(BasePermission):
    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        return user.is_staff or hasattr(user, "representative")

    def has_object_permission(self, request, view, obj):
        user = request.user

        if user.is_staff:
            return True

        if hasattr(user, "representative"):
            representative_organisation = user.representative.health_organisation

            if representative_organisation is None:
                return False

            return obj.doctor.health_organisation_id == representative_organisation.id

        return False


class TalonViewSet(ModelViewSet):
    serializer_class = TalonsSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [AllowAny()]

        if self.action in ("book", "cancel"):
            return [IsAuthenticated()]

        return [IsAuthenticated(), IsAdminOrRepresentativeForTalon()]

    def get_queryset(self):
        queryset = Talons.objects.select_related(
            "customer__user",
            "doctor__user",
            "doctor__health_organisation",
        )

        user = self.request.user

        if not user.is_authenticated:
            base_queryset = queryset.filter(customer__isnull=True)
        elif user.is_staff:
            base_queryset = queryset
        elif hasattr(user, "representative"):
            representative_organisation = user.representative.health_organisation
            base_queryset = queryset.filter(
                doctor__health_organisation=representative_organisation,
            )
        elif hasattr(user, "customer"):
            base_queryset = queryset.filter(
                Q(customer__user=user) | Q(customer__isnull=True),
            )
        elif hasattr(user, "doctor"):
            base_queryset = queryset.filter(doctor__user=user)
        else:
            base_queryset = queryset.filter(customer__isnull=True)

        date = self.request.query_params.get("date", "")
        time = self.request.query_params.get("time", "")

        active = self.request.query_params.get("active", "")

        if active in ["true", "on", "yes", "1"]:
            now = datetime.now(tz=UTC)
            cur_date = now.date()
            cur_time = now.time()
            base_queryset = base_queryset.filter(
                Q(date__gt=cur_date) | (Q(date=cur_date) & Q(time__gte=cur_time)),
            )
        elif active in ["false", "off", "no", "0"]:
            now = datetime.now(tz=UTC)
            cur_date = now.date()
            cur_time = now.time()
            base_queryset = base_queryset.filter(
                Q(date__lt=cur_date) | (Q(date=cur_date) & Q(time__lt=cur_time)),
            )

        if date and time:
            return base_queryset.filter(
                Q(date__gt=date) | (Q(date=date) & Q(time__gte=time)),
            )

        if date:
            return base_queryset.filter(date__gte=date)

        if time:
            return base_queryset.filter(
                date=datetime.now(tz=UTC).date(),
                time__gte=time,
            )

        return base_queryset

    def perform_create(self, serializer):
        doctor = serializer.validated_data["doctor"]

        self._ensure_user_can_manage_doctor(doctor)

        serializer.save(customer=None)

    def perform_update(self, serializer):
        doctor = serializer.validated_data.get("doctor", serializer.instance.doctor)

        self._ensure_user_can_manage_doctor(doctor)

        serializer.save()

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def book(self, request, pk=None):
        if not hasattr(request.user, "customer"):
            raise PermissionDenied("Only customers can book appointments.")

        with transaction.atomic():
            talon = get_object_or_404(
                Talons.objects.select_for_update(),
                pk=pk,
            )

            if self._is_past_talon(talon):
                return Response(
                    {"detail": "Cannot book a past appointment."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if talon.customer_id is not None:
                return Response(
                    {"detail": "This appointment is already booked."},
                    status=status.HTTP_409_CONFLICT,
                )

            talon.customer = request.user.customer
            talon.save(update_fields=["customer"])

        talon = self._get_talon_for_response(talon.pk)

        serializer = self.get_serializer(talon)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def cancel(self, request, pk=None):
        if not hasattr(request.user, "customer"):
            raise PermissionDenied("Only customers can cancel appointments.")

        with transaction.atomic():
            talon = get_object_or_404(
                Talons.objects.select_for_update(),
                pk=pk,
            )

            if talon.customer_id != request.user.customer.id:
                raise PermissionDenied("You can cancel only your own appointments.")

            if self._is_past_talon(talon):
                return Response(
                    {"detail": "Cannot cancel a past appointment."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            talon.customer = None
            talon.save(update_fields=["customer"])

        talon = self._get_talon_for_response(talon.pk)

        serializer = self.get_serializer(talon)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def _ensure_user_can_manage_doctor(self, doctor):
        user = self.request.user

        if user.is_staff:
            return

        if hasattr(user, "representative"):
            representative_organisation = user.representative.health_organisation

            if (
                representative_organisation is not None
                and doctor.health_organisation_id == representative_organisation.id
            ):
                return

        raise PermissionDenied(
            "You can manage appointment talons only for your organisation.",
        )

    def _get_talon_for_response(self, talon_id):
        return Talons.objects.select_related(
            "customer__user",
            "doctor__user",
            "doctor__health_organisation",
        ).get(pk=talon_id)

    def _is_past_talon(self, talon):
        today = timezone.localdate()
        current_time = timezone.localtime().time()

        return talon.date < today or (talon.date == today and talon.time < current_time)
