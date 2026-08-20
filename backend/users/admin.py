from django.contrib import admin

from .models import Admin, Customer, HealthOrganisationRepresentative

admin.site.register((Admin, Customer, HealthOrganisationRepresentative))
