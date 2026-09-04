from health_organisations.models import HealthOrganisation
from rest_framework import serializers
from rest_framework.serializers import ModelSerializer
from users.models import Doctor

from .models import Talons
from .utils import validate_appointment


class HealthOrganisationSerializer(ModelSerializer):
    class Meta:
        model = HealthOrganisation
        fields = ("name", "address", "phone", "email")


class TalonsSerializer(ModelSerializer):
    doctor = serializers.PrimaryKeyRelatedField(queryset=Doctor.objects.all(), write_only=True, required=True)

    doctor_info = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Talons
        fields = ("id", "customer", "doctor", "doctor_info", "date", "time")

    def get_doctor_info(self, obj):
        return {
            "id": obj.doctor.id,
            "position": obj.doctor.position,
            "health_organisation": HealthOrganisationSerializer(obj.doctor.health_organisation).data
            if obj.doctor.health_organisation
            else None,
        }

    def validate(self, data):
        doctor = data.get("doctor")
        appointment_date = data.get("date")
        appointment_time = data.get("time")
        validate_appointment(doctor, appointment_date, appointment_time, self.instance)
        return data
