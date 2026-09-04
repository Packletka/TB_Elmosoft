from django.contrib import admin

from .models import HealthOrganisation


@admin.register(HealthOrganisation)
class HealthOrganisationAdmin(admin.ModelAdmin):
    pass
