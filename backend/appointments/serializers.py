from health_organisations.models import HealthOrganisation
from rest_framework import serializers
from rest_framework.serializers import ModelSerializer
from users.models import Doctor

from .models import Talons
from .utils import validate_appointment


class TalonHealthOrganisationSerializer(ModelSerializer):
    class Meta:
        model = HealthOrganisation
        fields = (
            "id",
            "name",
            "address",
            "phone",
            "email",
            "site",
        )


class TalonDoctorSerializer(ModelSerializer):
    full_name = serializers.SerializerMethodField(read_only=True)
    last_name = serializers.CharField(source="user.last_name", read_only=True)
    first_name = serializers.CharField(source="user.first_name", read_only=True)
    patronymic = serializers.CharField(source="user.patronymic", read_only=True)
    health_organisation = TalonHealthOrganisationSerializer(read_only=True)

    class Meta:
        model = Doctor
        fields = (
            "id",
            "full_name",
            "last_name",
            "first_name",
            "patronymic",
            "position",
            "cabinet",
            "health_organisation",
        )

    def get_full_name(self, obj):
        name_parts = [
            obj.user.last_name,
            obj.user.first_name,
            obj.user.patronymic,
        ]

        return " ".join(part for part in name_parts if part)


class TalonsSerializer(ModelSerializer):
    customer = serializers.PrimaryKeyRelatedField(read_only=True)
    doctor = TalonDoctorSerializer(read_only=True)
    doctor_id = serializers.PrimaryKeyRelatedField(
        source="doctor",
        queryset=Doctor.objects.all(),
        write_only=True,
        required=True,
    )
    is_free = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Talons
        fields = (
            "id",
            "customer",
            "doctor",
            "doctor_id",
            "date",
            "time",
            "is_free",
        )

    def get_is_free(self, obj):
        return obj.customer_id is None

    def validate(self, data):
        doctor = data.get("doctor", self.instance.doctor if self.instance else None)
        appointment_date = data.get(
            "date",
            self.instance.date if self.instance else None,
        )
        appointment_time = data.get(
            "time",
            self.instance.time if self.instance else None,
        )

        if doctor and appointment_date and appointment_time:
            validate_appointment(
                doctor,
                appointment_date,
                appointment_time,
                self.instance,
            )

        return data
