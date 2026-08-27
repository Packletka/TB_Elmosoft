from appointments.views import TalonViewSet
from django.urls import include, path
from health_organisations.views import HealthOrganisationViewSet
from rest_framework.routers import DefaultRouter

from .views import (
    CustomUserViewSet,
    DoctorViewSet,
    RepresentativeViewSet,
)

router = DefaultRouter(trailing_slash=False)
router.register("user", CustomUserViewSet)
router.register("health-organisation", HealthOrganisationViewSet)
router.register("doctor", DoctorViewSet, basename="doctor")
router.register("representative", RepresentativeViewSet, basename="representative")
router.register("appointment", TalonViewSet, basename="appointment")

urlpatterns = [path("", include(router.urls))]
