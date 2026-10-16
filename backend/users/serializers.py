from collections.abc import Mapping
from typing import ClassVar

from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from health_organisations.models import HealthOrganisation
from phonenumber_field.serializerfields import PhoneNumberField
from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied
from rest_framework.serializers import ModelSerializer, Serializer

from .models import (
    Customer,
    Doctor,
    Representative,
)
from .passwords import validate_new_password

CustomUser = get_user_model()


class RegisterSerializer(Serializer):
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


class MeSerializer(Serializer):
    id = serializers.IntegerField()
    email = serializers.EmailField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    patronymic = serializers.CharField()
    role = serializers.SerializerMethodField()
    profile = serializers.SerializerMethodField()

    def get_role(self, obj):
        if obj.is_superuser or obj.is_staff:
            return "admin"
        elif hasattr(obj, "customer"):
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
        fields = ("id", "email", "password", "first_name", "last_name", "patronymic", "home_organisation", "created_by")
        extra_kwargs: ClassVar = {
            "email": {"required": True},
            "first_name": {"required": True},
            "last_name": {"required": True},
            "home_organisation": {"required": False, "allow_null": True},
            "created_by": {"read_only": True},
        }

    def validate(self, attrs):
        request = self.context.get("request")
        if request is None or self.instance is not None:
            return attrs

        user = request.user
        if user.is_staff or user.is_superuser or not hasattr(user, "representative"):
            return attrs

        rep_org = user.representative.health_organisation
        if rep_org is None:
            raise PermissionDenied("You must belong to an organisation to create accounts.")

        if attrs.get("home_organisation") not in (None, rep_org):
            raise PermissionDenied("You can only create accounts for your own organisation.")

        attrs["home_organisation"] = rep_org
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        request = self.context.get("request")
        if request is not None:
            validated_data["created_by"] = request.user
        user = CustomUser(**validated_data)
        if password:
            user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


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
        extra_kwargs: ClassVar = {"user": {"read_only": True}}


class DoctorHealthOrganisationSerializer(ModelSerializer):
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


class DoctorSerializer(ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.all(),
        write_only=True,
        required=True,
    )
    full_name = serializers.SerializerMethodField(read_only=True)
    last_name = serializers.CharField(source="user.last_name", read_only=True)
    first_name = serializers.CharField(source="user.first_name", read_only=True)
    patronymic = serializers.CharField(source="user.patronymic", read_only=True)
    health_organisation = DoctorHealthOrganisationSerializer(read_only=True)
    health_organisation_id = serializers.PrimaryKeyRelatedField(
        source="health_organisation",
        queryset=HealthOrganisation.objects.all(),
        write_only=True,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Doctor
        fields = (
            "id",
            "user",
            "full_name",
            "last_name",
            "first_name",
            "patronymic",
            "position",
            "cabinet",
            "slot_duration",
            "health_organisation",
            "health_organisation_id",
            "work_schedule",
        )

    def get_full_name(self, obj):
        name_parts = [
            obj.user.last_name,
            obj.user.first_name,
            obj.user.patronymic,
        ]

        return " ".join(part for part in name_parts if part)

    def validate_health_organisation_id(self, value):
        request = self.context.get("request")
        is_admin = request and (request.user.is_staff or request.user.is_superuser)

        if self.instance is not None and not is_admin:
            current_org_id = self.instance.health_organisation_id
            new_org_id = value.id if value else None
            if current_org_id != new_org_id:
                raise PermissionDenied("Only an admin can reassign a doctor to a different organisation.")

        return value

    def validate(self, attrs):
        request = self.context.get("request")
        if request is None:
            return attrs

        user = request.user
        if user.is_staff or user.is_superuser:
            return attrs

        if not hasattr(user, "representative"):
            return attrs

        rep_org = user.representative.health_organisation

        if self.instance is not None:
            if "health_organisation" in attrs and attrs["health_organisation"] != self.instance.health_organisation:
                raise PermissionDenied("Only an admin can reassign a doctor to a different organisation.")
        else:
            if rep_org is None:
                raise PermissionDenied("You must belong to an organisation to create a doctor.")

            target_user = attrs.get("user")
            if target_user is not None and target_user.home_organisation_id not in (None, rep_org.id):
                raise PermissionDenied(
                    "This account is earmarked for a different organisation and cannot be claimed here."
                )

            if "health_organisation" in attrs and attrs["health_organisation"] != rep_org:
                raise PermissionDenied("You can only create doctors within your own organisation.")
            attrs["health_organisation"] = rep_org

        return attrs


class RepresentativeSerializer(ModelSerializer):
    class Meta:
        model = Representative
        fields = (
            "id",
            "user",
            "health_organisation",
        )


class CustomerProfileSerializer(ModelSerializer):
    class Meta:
        model = Customer
        fields = ("sex", "birthday", "phone", "address")
        extra_kwargs: ClassVar = {field: {"required": False} for field in fields}


class DoctorProfileSerializer(ModelSerializer):
    class Meta:
        model = Doctor
        fields = ("position", "cabinet", "work_schedule", "slot_duration", "health_organisation")
        extra_kwargs: ClassVar = {field: {"required": False} for field in fields}


class RepresentativeProfileSerializer(ModelSerializer):
    class Meta:
        model = Representative
        fields = ("health_organisation",)
        extra_kwargs: ClassVar = {"health_organisation": {"required": False, "allow_null": True}}


# These have flows of their own
# They are refused loudly: DRF would silently ignore them and answer 200, so a client would think it worked
FIELDS_WITH_THEIR_OWN_FLOW = {
    "email": "The email address can't be changed here. Use POST /email/change.",
    "password": "The password can't be changed here. Use POST /password/change.",
}
PHONE_HAS_ITS_OWN_FLOW = "The phone number can't be changed here. Use POST /phone/change/request."


class UserUpdateSerializer(Serializer):
    first_name = serializers.CharField(required=False)
    last_name = serializers.CharField(required=False)
    patronymic = serializers.CharField(required=False, allow_blank=True)

    def to_internal_value(self, data):
        # Anything that is not a dict gets the usual "expected a dictionary" error from super()
        if isinstance(data, Mapping):
            refused = {name: [message] for name, message in FIELDS_WITH_THEIR_OWN_FLOW.items() if name in data}
            if refused:
                raise serializers.ValidationError(refused)
        return super().to_internal_value(data)

    @transaction.atomic
    def update(self, instance, validated_data):
        instance.first_name = validated_data.get("first_name", instance.first_name)
        instance.last_name = validated_data.get("last_name", instance.last_name)
        instance.patronymic = validated_data.get("patronymic", instance.patronymic)

        instance.save()
        return instance

    def to_representation(self, instance):
        return MeSerializer(instance).data


class CustomerUpdateSerializer(UserUpdateSerializer):
    profile = CustomerProfileSerializer(required=False)

    def to_internal_value(self, data):
        # Refused as loudly as the email and the password: the number changes only with a code from the mailbox
        if isinstance(data, Mapping):
            profile = data.get("profile")
            if isinstance(profile, Mapping) and "phone" in profile:
                raise serializers.ValidationError({"profile": {"phone": [PHONE_HAS_ITS_OWN_FLOW]}})
        return super().to_internal_value(data)

    @transaction.atomic
    def update(self, instance, validated_data):
        instance = super().update(instance, validated_data)

        profile_data = validated_data.get("profile", {})

        if not profile_data:
            return instance

        # No customer attached to this instance
        if not hasattr(instance, "customer"):
            return instance

        customer = instance.customer
        serializer = CustomerProfileSerializer(customer, data=profile_data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return instance


class DoctorUpdateSerializer(UserUpdateSerializer):
    profile = DoctorProfileSerializer(required=False)

    @transaction.atomic
    def update(self, instance, validated_data):
        instance = super().update(instance, validated_data)

        profile_data = validated_data.get("profile", {})

        if not profile_data:
            return instance

        # No doctor attached to this user
        if not hasattr(instance, "doctor"):
            return instance

        doctor = instance.doctor
        serializer = DoctorProfileSerializer(doctor, data=profile_data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return instance


class RepresentativeUpdateSerializer(UserUpdateSerializer):
    profile = RepresentativeProfileSerializer(required=False)

    @transaction.atomic
    def update(self, instance, validated_data):
        instance = super().update(instance, validated_data)

        profile_data = validated_data.get("profile", {})

        if not profile_data:
            return instance

        # No representative attached to this user
        if not hasattr(instance, "representative"):
            return instance

        rep = instance.representative
        serializer = RepresentativeProfileSerializer(rep, data=profile_data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return instance


class PasswordForgotSerializer(Serializer):
    email = serializers.EmailField()


class PasswordResetSerializer(Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    # Kept exactly as typed (no trimming), the same as at login. max_length keeps hashing cheap.
    new_password = serializers.CharField(write_only=True, trim_whitespace=False, max_length=128)

    def validate(self, attrs):
        user = self._get_user(attrs["uid"])
        # One message for a bad uid, a wrong token and an expired one, so the answer tells an attacker nothing.
        if user is None or not default_token_generator.check_token(user, attrs["token"]):
            raise serializers.ValidationError({"token": "This link is invalid or has expired. Request a new one."})
        # Only after the token is proven: the password rules are not an oracle for strangers.
        try:
            validate_new_password(user, attrs["new_password"])
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"new_password": list(exc.messages)}) from exc
        attrs["user"] = user
        return attrs

    @staticmethod
    def _get_user(uid):
        try:
            return CustomUser.objects.get(pk=force_str(urlsafe_base64_decode(uid)), is_active=True)
        except (TypeError, ValueError, OverflowError, CustomUser.DoesNotExist):
            return None


class PasswordChangeSerializer(Serializer):
    current_password = serializers.CharField(write_only=True, trim_whitespace=False, max_length=128)
    new_password = serializers.CharField(write_only=True, trim_whitespace=False, max_length=128)

    def validate_current_password(self, value):
        if not self.context["request"].user.check_password(value):
            raise serializers.ValidationError("The current password is incorrect.")
        return value

    def validate(self, attrs):
        # DRF skips validate() when a field already failed, so the rules for the new password are shown only
        # after the current password is right
        try:
            validate_new_password(self.context["request"].user, attrs["new_password"])
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"new_password": list(exc.messages)}) from exc
        return attrs


class PhoneChangeRequestSerializer(Serializer):
    # region="BY": a number typed the way people write it at home ("8 029 123-45-67") is understood too
    phone = PhoneNumberField(region="BY")

    def validate_phone(self, value):
        if str(value) == str(self.context["request"].user.customer.phone):
            raise serializers.ValidationError("This is already your phone number.")
        return value


class PhoneChangeConfirmSerializer(Serializer):
    code = serializers.CharField(max_length=20)

    def validate_code(self, value):
        # A code copied as "123 456" is as good as "123456"
        return "".join(value.split())


class EmailChangeSerializer(Serializer):
    current_password = serializers.CharField(write_only=True, trim_whitespace=False, max_length=128)
    new_email = serializers.EmailField(max_length=254)

    def validate_current_password(self, value):
        if not self.context["request"].user.check_password(value):
            raise serializers.ValidationError("The current password is incorrect.")
        return value

    def validate_new_email(self, value):
        # The same cleaning registration gets: the part after @ is lowercased
        return CustomUser.objects.normalize_email(value)

    def validate(self, attrs):
        # DRF skips validate() when a field already failed, so whether an address is taken is revealed only after
        # the current password is right
        email = attrs["new_email"]
        if email.lower() == self.context["request"].user.email.lower():
            raise serializers.ValidationError({"new_email": ["This is already your email address."]})
        # iexact, so nobody can end up with an address that differs from another account's only in letter case
        if CustomUser.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError({"new_email": ["A user with this email already exists."]})
        return attrs
