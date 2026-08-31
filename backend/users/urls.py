from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    CustomUserViewSet,
    DoctorViewSet,
    RepresentativeViewSet,
)

router = DefaultRouter(trailing_slash=False)
router.register("user", CustomUserViewSet)
router.register("doctor", DoctorViewSet, basename="doctor")
router.register("representative", RepresentativeViewSet, basename="representative")

urlpatterns = [path("", include(router.urls))]
