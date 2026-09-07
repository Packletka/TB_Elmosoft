from appointments.views import TalonViewSet
from django.contrib import admin
from django.urls import include, path
from health_organisations.views import HealthOrganisationViewSet
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenBlacklistView,
    TokenObtainPairView,
    TokenRefreshView,
)
from users.views import (
    CustomUserViewSet,
    DoctorViewSet,
    RepresentativeViewSet,
)

router = DefaultRouter(trailing_slash=False)

router.register("user", CustomUserViewSet, basename="user")
router.register("doctor", DoctorViewSet, basename="doctor")
router.register("representative", RepresentativeViewSet, basename="representative")
router.register("appointment", TalonViewSet, basename="appointment")
router.register(
    "health-organisation",
    HealthOrganisationViewSet,
    basename="health-organisation",
)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/v1/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/v1/token/blacklist/", TokenBlacklistView.as_view(), name="token_blacklist"),
    path("api/v1/", include(router.urls)),
]
