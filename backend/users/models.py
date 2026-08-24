from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
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


class CustomUser(AbstractBaseUser):
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


class Customer(models.Model):
    SEX = (
        ("M", "Male"),
        ("F", "Female"),
    )

    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE)

    sex = models.CharField(max_length=1, choices=SEX, blank=False)
    birthday = models.DateField()
    phone = PhoneNumberField(default="", blank=False, region="BY")
    address = models.TextField(blank=True, default="")

    def __str__(self):
        return f"{self.user.last_name} {self.user.first_name}"


class Doctor(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE)
    health_organisation = models.ForeignKey(HealthOrganisation, on_delete=models.CASCADE, null=True, blank=True)

    position = models.CharField(max_length=150, blank=False)
    cabinet = models.IntegerField(validators=[MinValueValidator(1)])
    work_schedule = models.TextField()
    slot_duration = models.IntegerField(validators=[MinValueValidator(1)])

    def __str__(self):
        return f"{self.user.last_name} {self.user.first_name} ({self.position})"


class Representative(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE)
    health_organisation = models.ForeignKey(HealthOrganisation, on_delete=models.CASCADE, null=True, blank=True)

    def __str__(self):
        return f"{self.user.last_name} {self.user.first_name}"
