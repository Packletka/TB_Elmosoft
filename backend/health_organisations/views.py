from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.viewsets import ModelViewSet

from .models import HealthOrganisation
from .serializers import HealthOrganisationSerializer


class HealthOrganisationViewSet(ModelViewSet):
    serializer_class = HealthOrganisationSerializer
    queryset = HealthOrganisation.objects.all()

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [AllowAny()]

        return [IsAdminUser()]
