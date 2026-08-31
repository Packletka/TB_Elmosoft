from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import TalonViewSet

router = DefaultRouter(trailing_slash=False)
router.register("appointment", TalonViewSet, basename="appointment")

urlpatterns = [
    path("", include(router.urls)),
]
