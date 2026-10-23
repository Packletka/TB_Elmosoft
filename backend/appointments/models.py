from django.db import models
from users.models import Customer, Doctor


class Talons(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, null=True, blank=True)
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, null=False)
    date = models.DateField()
    time = models.TimeField()
    customer_who_was_reminded = models.ForeignKey(
        Customer, on_delete=models.SET_NULL, null=True, blank=True, editable=False, related_name="reminded_talons"
    )

    class Meta:
        unique_together = ("doctor", "date", "time")

    def __str__(self):
        return f"{self.date} {self.time}"
