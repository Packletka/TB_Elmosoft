from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import TalonViewSet

router = DefaultRouter()
router.register("details", TalonViewSet)

urlpatterns = [path("/", include(router.urls))]
