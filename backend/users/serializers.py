from typing import ClassVar

from rest_framework import serializers
from rest_framework.serializers import ModelSerializer

from .models import Customer, CustomUser, Doctor, Representative


class CustomUserSerializer(ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = CustomUser
        fields = (
            "id",
            "email",
            "password",
            "first_name",
            "last_name",
            "patronymic",
        )
        extra_kwargs: ClassVar = {
            "email": {"required": True},
            "first_name": {"required": True},
            "last_name": {"required": True},
        }


class CustomerSerializer(ModelSerializer):
    class Meta:
        model = Customer
        fields = (
            "id",
            "user",
            "sex",
            "birthday",
            "phone",
            "address",
        )


class DoctorSerializer(ModelSerializer):
    class Meta:
        model = Doctor
        fields = (
            "id",
            "user",
            "health_organisation",
            "position",
            "cabinet",
            "work_schedule",
            "slot_duration",
        )


class RepresentativeSerializer(ModelSerializer):
    class Meta:
        model = Representative
        fields = (
            "id",
            "user",
            "health_organisation",
        )
