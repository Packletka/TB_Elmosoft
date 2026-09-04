from django.contrib import admin

from .models import Talons


@admin.register(Talons)
class TalonsAdmin(admin.ModelAdmin):
    pass
