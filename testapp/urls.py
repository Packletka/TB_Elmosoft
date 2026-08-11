from django.urls import path
from .views import TalonViewSet
from rest_framework.routers import DefaultRouter
from django.urls import include


router = DefaultRouter()
router.register('/details', TalonViewSet)


urlpatterns = [
    path('', include(router.urls)),
]
