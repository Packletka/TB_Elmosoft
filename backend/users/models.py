from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator
from django.db import models
from health_organisations.models import HealthOrganisation
from phonenumber_field.modelfields import PhoneNumberField


class CustomUser(AbstractUser):
    patronymic = models.CharField(max_length=50, blank=True)

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
    health_organisation = models.ForeignKey(
        HealthOrganisation, on_delete=models.CASCADE, null=True, blank=True
    )

    position = models.CharField(max_length=100, blank=False)
    cabinet = models.IntegerField(validators=[MinValueValidator(1)])
    work_schedule = models.TextField()
    slot_duration = models.IntegerField(validators=[MinValueValidator(1)])

    def __str__(self):
        return f"{self.user.last_name} {self.user.first_name} ({self.position})"


class Representative(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE)
    health_organisation = models.ForeignKey(
        HealthOrganisation, on_delete=models.CASCADE, null=True, blank=True
    )

    def __str__(self):
        return f"{self.user.last_name} {self.user.first_name}"
