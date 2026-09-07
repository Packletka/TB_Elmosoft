from datetime import UTC, datetime

from django.db.models import Q
from rest_framework.viewsets import ModelViewSet

from .models import Talons
from .serializers import TalonsSerializer


class TalonViewSet(ModelViewSet):
    serializer_class = TalonsSerializer

    def get_queryset(self):
        user = self.request.user

        if not user.is_authenticated:
            return Talons.objects.filter(customer__isnull=True)

        base_queryset = Talons.objects.select_related("doctor__health_organisation").filter(
            Q(customer__user=user) | Q(customer__isnull=True)  # <-- FIXED: use customer__user
        )

        date = self.request.query_params.get("date", "")
        time = self.request.query_params.get("time", "")

        active = self.request.query_params.get("active", "")

        if active in ["true", "on", "yes", "1"]:
            now = datetime.now(tz=UTC)
            cur_date = now.date()
            cur_time = now.time()
            # override the queryset to future usage
            base_queryset = base_queryset.filter(Q(date__gt=cur_date) | Q(date=cur_date) & Q(time__gte=cur_time))
        elif active in ["false", "off", "no", "0"]:
            now = datetime.now(tz=UTC)
            cur_date = now.date()
            cur_time = now.time()
            base_queryset = base_queryset.filter(Q(date__lt=cur_date) | (Q(date=cur_date) & Q(time__lt=cur_time)))

        if date and time:
            return base_queryset.filter(Q(date__gt=date) | Q(date=date) & Q(time__gte=time))
        elif date:
            return base_queryset.filter(date__gte=date)
        elif time:
            return base_queryset.filter(date=datetime.now(tz=UTC).date(), time__gte=time)
        return base_queryset

    def perform_create(self, serializer):
        # Automatically assign the current user's Customer to the appointment
        customer = self.request.user.customer
        serializer.save(customer=customer)
