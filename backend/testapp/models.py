from django.db import models
from django.core.validators import MinValueValidator


class Talon(models.Model):
    institution = models.CharField(max_length=128, blank=False)
    institution_address = models.CharField(max_length=64, blank=True)
    specialist = models.CharField(max_length=64, blank=False)
    specialist_full_name = models.CharField(max_length=64, blank=False)
    office = models.IntegerField(validators=[MinValueValidator(1)])
    date_and_time = models.DateTimeField()
    patient = models.CharField(max_length=64, blank=False)

    def __str__(self):
        return f"{self.specialist}, {self.specialist_full_name}"
