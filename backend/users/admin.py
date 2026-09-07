from django.contrib import admin

from .models import Customer, CustomUser, Doctor, Representative


@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    pass


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    pass


@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    pass


@admin.register(Representative)
class RepresentativeAdmin(admin.ModelAdmin):
    pass
