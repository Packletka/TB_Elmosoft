from appointments.models import Talons
from django.core.cache import cache
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Customer, CustomUser, Doctor, Representative
from .passwords import set_password_and_end_sessions
from .permissions import CanCreateUserAccount, IsAdminOrRepresentativeForDoctor
from .serializers import (
    CustomerSerializer,
    CustomerUpdateSerializer,
    CustomUserSerializer,
    DoctorSerializer,
    DoctorUpdateSerializer,
    MeSerializer,
    PasswordChangeSerializer,
    PasswordForgotSerializer,
    PasswordResetSerializer,
    RegisterSerializer,
    RepresentativeSerializer,
    RepresentativeUpdateSerializer,
    UserUpdateSerializer,
)
from .tasks import send_password_changed_email, send_password_reset_email


class CustomUserViewSet(
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    lookup_value_regex = "[0-9]+"
    serializer_class = CustomUserSerializer
    queryset = CustomUser.objects.all()

    def get_permissions(self):
        if self.action == "register":
            return [AllowAny()]
        elif self.action in ["me", "update_me", "delete_me"]:
            return [IsAuthenticated()]
        elif self.action == "create":
            return [CanCreateUserAccount()]
        return [IsAdminUser()]

    @action(detail=False, methods=["POST"])
    def register(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["GET"])
    def me(self, request):
        serializer = MeSerializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=["PUT", "PATCH"])
    def update_me(self, request):
        user = request.user

        if hasattr(user, "customer"):
            serializer_class = CustomerUpdateSerializer
        elif hasattr(user, "doctor"):
            serializer_class = DoctorUpdateSerializer
        elif hasattr(user, "representative"):
            serializer_class = RepresentativeUpdateSerializer
        else:
            serializer_class = UserUpdateSerializer

        serializer = serializer_class(
            instance=user, data=request.data, partial=request.method == "PATCH", context={"request": request}
        )

        serializer.is_valid(raise_exception=True)

        serializer.save()

        return Response(serializer.data)

    @action(detail=False, methods=["DELETE"])
    def delete_me(self, request):
        user = request.user
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CustomerViewSet(
    mixins.RetrieveModelMixin, mixins.UpdateModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet
):
    serializer_class = CustomerSerializer
    queryset = Customer.objects.all()

    permission_classes = (IsAdminUser,)


class DoctorViewSet(ModelViewSet):
    serializer_class = DoctorSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [AllowAny()]

        return [IsAdminOrRepresentativeForDoctor()]

    def get_queryset(self):
        queryset = Doctor.objects.select_related(
            "user",
            "health_organisation",
        ).order_by("id")

        if self.action == "list":
            health_organisation_id = self._get_positive_int_query_param(
                "health_organisation",
            )

            if health_organisation_id is not None:
                queryset = queryset.filter(
                    health_organisation_id=health_organisation_id,
                )

            return queryset

        if self.action == "retrieve":
            return queryset

        user = self.request.user

        # If representative -> manage only doctors from their organization
        if user.is_authenticated and hasattr(user, "representative"):
            rep_org = user.representative.health_organisation
            if rep_org is None:
                return queryset.none()
            return queryset.filter(health_organisation=rep_org)

        return queryset

    def perform_destroy(self, instance):
        now = timezone.now()

        has_upcoming_bookings = (
            Talons.objects.filter(doctor=instance, customer__isnull=False)
            .filter(Q(date__gt=now.date()) | Q(date=now.date(), time__gte=now.time()))
            .exists()
        )

        if has_upcoming_bookings:
            raise ValidationError(
                "Cannot delete a doctor who has upcoming booked appointments. Cancel them first.",
            )

        instance.delete()

    def _get_positive_int_query_param(self, name):
        value = self.request.query_params.get(name, "")

        if not value:
            return None

        try:
            parsed_value = int(value)
        except ValueError as exc:
            raise ValidationError({name: "Must be a valid integer."}) from exc

        if parsed_value <= 0:
            raise ValidationError({name: "Must be a positive integer."})

        return parsed_value


class RepresentativeViewSet(ModelViewSet):
    serializer_class = RepresentativeSerializer
    queryset = Representative.objects.all()

    permission_classes = (IsAdminUser,)


# One reset email per account per minute, whoever asks. Together with the per-address throttle this stops anyone
# from filling somebody's inbox with reset emails.
PASSWORD_RESET_EMAIL_COOLDOWN = 60


class PasswordForgotView(APIView):
    """Start a password reset: email a link to the account with this address, if there is one."""

    # No authentication on purpose: an expired access token left in the browser must not turn this public page
    # into a 401.
    authentication_classes = ()
    permission_classes = (AllowAny,)
    throttle_classes = (ScopedRateThrottle,)
    throttle_scope = "password_forgot"

    def post(self, request):
        serializer = PasswordForgotSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = CustomUser.objects.filter(email__iexact=serializer.validated_data["email"], is_active=True).first()
        # cache.add stores the key only if it is missing, in one atomic step, so two quick requests send one email.
        if user is not None and cache.add(f"password-reset-cooldown:{user.pk}", 1, PASSWORD_RESET_EMAIL_COOLDOWN):
            send_password_reset_email.delay(user.pk)

        # The same answer whether or not the account exists, so this page cannot be used to find out who has one.
        return Response(
            {"detail": "If an account with this email exists, we have sent instructions to it."},
            status=status.HTTP_202_ACCEPTED,
        )


class PasswordResetView(APIView):
    """Finish a password reset with the uid and token from the emailed link."""

    authentication_classes = ()
    permission_classes = (AllowAny,)
    throttle_classes = (ScopedRateThrottle,)
    throttle_scope = "password_reset"

    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]
        set_password_and_end_sessions(user, serializer.validated_data["new_password"])
        # on_commit: the worker must never run before the new password is really saved.
        transaction.on_commit(lambda: send_password_changed_email.delay(user.pk))
        return Response({"detail": "Password changed. Sign in with your new password."})


class PasswordChangeView(APIView):
    """Change the password of the signed-in user. Needs the current password, so a stolen session is not enough."""

    permission_classes = (IsAuthenticated,)
    # Counted per account: someone holding a stolen access token must not be able to guess the current password
    throttle_classes = (ScopedRateThrottle,)
    throttle_scope = "password_change"

    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        user = request.user
        set_password_and_end_sessions(user, serializer.validated_data["new_password"])
        transaction.on_commit(lambda: send_password_changed_email.delay(user.pk))

        # Every session is over, this device's included. It gets a new one, so the user stays signed in here.
        refresh = RefreshToken.for_user(user)
        return Response({"detail": "Password changed.", "access": str(refresh.access_token), "refresh": str(refresh)})
