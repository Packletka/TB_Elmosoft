from rest_framework.serializers import ModelSerializer
from .models import Talon


class TalonSerializer(ModelSerializer):
    class Meta:
        model = Talon
        fields = '__all__'
