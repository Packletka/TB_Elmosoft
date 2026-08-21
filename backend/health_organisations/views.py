from rest_framework.viewsets import ModelViewSet

from .models import HealthOrganisation
from .serializers import HealthOrganisationSerializer


class HealthOrganisationViewSet(ModelViewSet):
    serializer_class = HealthOrganisationSerializer
    queryset = HealthOrganisation.objects.all()
