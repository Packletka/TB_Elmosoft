from rest_framework.serializers import ModelSerializer

from .models import Talons


class TalonsSerializer(ModelSerializer):
    class Meta:
        model = Talons
        fields = ("id", "customer", "doctor", "date", "time")
