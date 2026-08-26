from typing import ClassVar

from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import serializers
from rest_framework.serializers import ModelSerializer

from .models import (
    Customer,
    Doctor,
    Representative,
)

CustomUser = get_user_model()


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    patronymic = serializers.CharField(required=False, allow_blank=True)

    sex = serializers.ChoiceField(choices=Customer.SEX, required=True)
    birthday = serializers.DateField(required=True)
    phone = serializers.CharField(required=True)
    address = serializers.CharField(required=False, allow_blank=True)

    def validate_email(self, value):
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        user_data = {
            "email": validated_data["email"],
            "first_name": validated_data["first_name"],
            "last_name": validated_data["last_name"],
            "patronymic": validated_data.get("patronymic", ""),
        }
        password = validated_data["password"]

        user = CustomUser(**user_data)
        user.set_password(password)
        user.save()

        customer_data = {
            "user": user,
            "sex": validated_data["sex"],
            "birthday": validated_data["birthday"],
            "phone": validated_data["phone"],
            "address": validated_data.get("address", ""),
        }
        Customer.objects.create(**customer_data)

        return user

    def to_representation(self, instance):
        try:
            customer = instance.customer
        except Customer.DoesNotExist:
            customer = None

        return {
            "id": instance.id,
            "email": instance.email,
            "first_name": instance.first_name,
            "last_name": instance.last_name,
            "patronymic": instance.patronymic,
            "role": "customer",
            "profile": {
                "sex": customer.sex if customer else None,
                "birthday": customer.birthday if customer else None,
                "phone": str(customer.phone) if customer else None,
                "address": customer.address if customer else None,
            },
        }


class MeSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    email = serializers.EmailField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    patronymic = serializers.CharField()
    role = serializers.SerializerMethodField()
    profile = serializers.SerializerMethodField()

    def get_role(self, obj):
        if hasattr(obj, "customer"):
            return "customer"
        elif hasattr(obj, "doctor"):
            return "doctor"
        elif hasattr(obj, "representative"):
            return "representative"
        return None

    def get_profile(self, obj):
        if hasattr(obj, "customer"):
            customer = obj.customer
            return {
                "sex": customer.sex,
                "birthday": customer.birthday,
                "phone": str(customer.phone),
                "address": customer.address,
            }
        elif hasattr(obj, "doctor"):
            doctor = obj.doctor
            return {
                "position": doctor.position,
                "cabinet": doctor.cabinet,
                "work_schedule": doctor.work_schedule,
                "slot_duration": doctor.slot_duration,
                "health_organisation_id": doctor.health_organisation_id,
            }
        elif hasattr(obj, "representative"):
            rep = obj.representative
            return {
                "health_organisation_id": rep.health_organisation_id,
            }
        return None


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


class UpdateMeSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False)
    first_name = serializers.CharField(required=False)
    last_name = serializers.CharField(required=False)
    patronymic = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, required=False)

    profile = serializers.DictField(required=False)

    def validate_email(self, value):
        user = self.context["request"].user
        if CustomUser.objects.exclude(pk=user.pk).filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    @transaction.atomic
    def update(self, instance, validated_data):
        instance.email = validated_data.get("email", instance.email)
        instance.first_name = validated_data.get("first_name", instance.first_name)
        instance.last_name = validated_data.get("last_name", instance.last_name)
        instance.patronymic = validated_data.get("patronymic", instance.patronymic)

        if "password" in validated_data:
            instance.set_password(validated_data["password"])

        instance.save()

        # updating th profile
        profile_data = validated_data.get("profile", {})
        if profile_data:
            if hasattr(instance, "customer"):
                customer = instance.customer
                allowed_fields = {"sex", "birthday", "phone", "address"}
                for key, value in profile_data.items():
                    if key in allowed_fields:
                        setattr(customer, key, value)
                customer.save()

            elif hasattr(instance, "doctor"):
                doctor = instance.doctor
                allowed_fields = {"position", "cabinet", "work_schedule", "slot_duration"}
                if "health_organisation" in profile_data:
                    pass
                for key, value in profile_data.items():
                    if key in allowed_fields:
                        setattr(doctor, key, value)
                doctor.save()

            elif hasattr(instance, "representative"):
                # rep = instance.representative
                if "health_organisation" in profile_data:
                    pass

        return instance

    def to_representation(self, instance):
        return MeSerializer(instance).data
