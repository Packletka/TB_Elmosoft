from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models
from health_organisations.models import HealthOrganisation
from phonenumber_field.modelfields import PhoneNumberField


class UserManager(BaseUserManager):
    def create_user(self, email, password, **kwargs):
        if not email:
            raise ValueError("Users must have an email address")
        user = self.model(
            email=self.normalize_email(email),
            **kwargs,
        )
        user.set_password(password)
        user.save()
        return user

    def create_superuser(self, email, password, **kwargs):
        kwargs.setdefault("is_staff", True)
        kwargs.setdefault("is_superuser", True)
        return self.create_user(email, password, **kwargs)


# from stackoverflow to prevent this error -> 'CustomUser' object has no attribute 'has_module_perms'
# inherited PermissionsMixin. Actually works!
class CustomUser(AbstractBaseUser, PermissionsMixin):
    last_name = models.CharField(max_length=30, blank=False, null=False)
    first_name = models.CharField(max_length=30, blank=False, null=False)
    patronymic = models.CharField(max_length=50, blank=True)

    email = models.EmailField(unique=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ()

    def __str__(self):
        return f"{self.last_name} {self.first_name} {self.patronymic}"

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def clean(self):
        super().clean()
        if (self.is_staff or self.is_superuser) and (
            hasattr(self, "customer") or hasattr(self, "doctor") or hasattr(self, "representative")
        ):
            raise ValidationError("An admin cannot also hold another role.")


def _validate_single_role(user, own_relation_name):
    """Raise if `user` already has a role other than `own_relation_name`."""
    if user.is_staff or user.is_superuser:
        raise ValidationError("This user is an admin and cannot also hold another role.")

    for relation_name in ("customer", "doctor", "representative"):
        if relation_name != own_relation_name and hasattr(user, relation_name):
            raise ValidationError("This user already has a different role.")


class Customer(models.Model):
    SEX = (
        ("M", "Male"),
        ("F", "Female"),
    )

    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE)

    sex = models.CharField(max_length=1, choices=SEX, blank=False)
    birthday = models.DateField()
    phone = PhoneNumberField(default="", blank=False, region="BY")
    address = models.CharField(max_length=150, blank=True, default="")

    def __str__(self):
        return f"{self.last_name} {self.first_name} {self.patronymic}"

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def clean(self):
        super().clean()
        _validate_single_role(self.user, "customer")


class Doctor(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE)
    health_organisation = models.ForeignKey(HealthOrganisation, on_delete=models.CASCADE, null=True, blank=True)

    position = models.CharField(max_length=150, blank=False)
    cabinet = models.IntegerField(validators=[MinValueValidator(1)])
    work_schedule = models.JSONField()
    slot_duration = models.IntegerField(validators=[MinValueValidator(1)])

    def __str__(self):
        return f"{self.last_name} {self.first_name} {self.patronymic}"

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def clean(self):
        super().clean()
        _validate_single_role(self.user, "doctor")


class Representative(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE)
    health_organisation = models.ForeignKey(HealthOrganisation, on_delete=models.CASCADE, null=True, blank=True)

    def __str__(self):
        return f"{self.user.last_name} {self.user.first_name}"

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def clean(self):
        super().clean()
        _validate_single_role(self.user, "representative")
