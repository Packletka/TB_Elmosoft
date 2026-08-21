from django.db import models
from phonenumber_field.modelfields import PhoneNumberField


class HealthOrganisation(models.Model):
    name = models.CharField(max_length=128, blank=False)
    address = models.TextField(blank=False)
    general_info = models.TextField(blank=True, default="")
    phone = PhoneNumberField(default="", blank=False, region="BY")
    email = models.EmailField(blank=False)
    site = models.CharField(max_length=50, blank=True)
    schedule = models.TextField(blank=False)

    def __str__(self):
        return self.name
