from django.db import models
from phonenumber_field.modelfields import PhoneNumberField


class Admin(models.Model):
    # Заглушка
    def __str__(self):
        return self.id


class Customer(models.Model):
    SEX = (
        ("M", "Male"),
        ("F", "Female"),
    )

    last_name = models.CharField(max_length=20, blank=False)
    first_name = models.CharField(max_length=20, blank=False)
    patronymic = models.CharField(max_length=20, blank=True, default="")
    sex = models.CharField(choices=SEX, blank=False)
    birthday_date = models.DateField()

    # https://django-phonenumber-field.readthedocs.io/en/stable/
    phone_number = PhoneNumberField(blank=True, default="", region="BY")

    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)

    # TODO: In future in should be "choices" of all polyclinics from DB with reference
    territorial_polyclinic = models.CharField()

    def __str__(self):
        return f"#{self.id}: {self.last_name} {self.first_name}"


class HealthOrganisationRepresentative(models.Model):
    IS_ON_VACATION = (
        ("Y", "Yes"),
        ("N", "No"),
    )

    last_name = models.CharField(max_length=20, blank=False)
    first_name = models.CharField(max_length=20, blank=False)
    patronymic = models.CharField(max_length=20, blank=True, default="")

    position = models.CharField(max_length=100, blank=False)
    photo = models.ImageField(blank=True, width_field=360, height_field=640)
    work_schedule = models.TextField()
    is_on_vacation = models.BooleanField(choices=IS_ON_VACATION)

    def __str__(self):
        return f"{self.last_name} {self.first_name}: {self.position}"
