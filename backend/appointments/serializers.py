import datetime

from health_organisations.models import HealthOrganisation
from rest_framework import serializers
from rest_framework.serializers import ModelSerializer
from rest_framework.validators import ValidationError

from .models import Talons


class HealthOrganisationSerializer(ModelSerializer):
    class Meta:
        model = HealthOrganisation
        fields = ("name", "address", "phone", "email")


class TalonsSerializer(ModelSerializer):
    doctor = serializers.SerializerMethodField()

    class Meta:
        model = Talons
        fields = ("id", "customer", "doctor", "date", "time")

    def get_doctor(self, obj):
        return {
            "id": obj.doctor.id,
            "position": obj.doctor.position,
            "health_organisation": HealthOrganisationSerializer(obj.doctor.health_organisation).data
            if obj.doctor.health_organisation
            else None,
        }

    def validate(self, data):
        def time_to_minutes(time_ser_or_obj):
            if not time_ser_or_obj:
                return 0
            if isinstance(time_ser_or_obj, str):
                # HH:MM format
                hours, minutes = map(int, time_ser_or_obj.split(":"))
                return hours * 60 + minutes
            elif isinstance(time_ser_or_obj, datetime.time):
                return time_ser_or_obj.hour * 60 + time_ser_or_obj.minute

        doctor = data.get("doctor")

        appointment_date = data.get("date")
        appointment_time = time_to_minutes(data.get("time"))

        doctor_schedule = doctor.work_schedule
        doctor_day_schedule = doctor_schedule.get(appointment_date.strftime("%A"), {})

        org_instance = doctor.health_organisation
        org_schedule = org_instance.schedule
        org_day_schedule = org_schedule.get(appointment_date.strftime("%A"), {})

        # Check 1: Doctor and organization working on this day
        if not doctor_day_schedule:
            raise ValidationError("Doctor is not working in that day")
        elif not org_day_schedule:
            raise ValidationError("Organization is closed on this day")

        doctor_opening_time = time_to_minutes(doctor_day_schedule.get("start", ""))
        doctor_closing_time = time_to_minutes(doctor_day_schedule.get("finish", ""))

        organisation_opening_time = time_to_minutes(org_day_schedule.get("open", ""))
        organisation_closing_time = time_to_minutes(org_day_schedule.get("close", ""))

        # Check 2: Global hours (07:00–20:00)
        # P.S. Belarus rule
        if appointment_time < 420:
            raise ValidationError("Invalid appointments opening time")
        elif appointment_time > 1200:
            raise ValidationError("Invalid appointments closure time")

        # Check 3: Effective working window (doctor and organization)
        if appointment_time < max(organisation_opening_time, doctor_opening_time):
            raise ValidationError("Appointment time should be 'ge' doctor/health org opening time")
        if appointment_time + doctor.slot_duration > min(organisation_closing_time, doctor_closing_time):
            raise ValidationError("Appointment time should be 'le' doctor/health org closing time minus slot duration")

        # Check 4: Slot alignment
        minutes_since_doctor_start = appointment_time - doctor_opening_time
        if minutes_since_doctor_start % doctor.slot_duration != 0:
            raise ValidationError("Time must align with the doctor's schedule")

        # Check 5: Overlap check
        existing_appointments = Talons.objects.filter(doctor=doctor, date=appointment_date)

        if self.instance:
            existing_appointments = existing_appointments.exclude(pk=self.instance.pk)

        new_start = appointment_time
        new_end = appointment_time + doctor.slot_duration

        for existing in existing_appointments:
            existing_start = time_to_minutes(existing.time)
            existing_end = existing_start + doctor.slot_duration

            if new_start < existing_end and new_end > existing_start:
                raise ValidationError(f"This time slot overlaps with an existing appointment at {existing.time}")

        return data

    def get_queryset(self):
        return Talons.objects.select_related("doctor__health_organisation")
