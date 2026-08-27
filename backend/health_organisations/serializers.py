from rest_framework.serializers import ModelSerializer

from .models import HealthOrganisation


class HealthOrganisationSerializer(ModelSerializer):
    class Meta:
        model = HealthOrganisation
        fields = "__all__"
