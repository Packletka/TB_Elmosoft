from rest_framework.viewsets import ModelViewSet

from .models import Customer, CustomUser, Doctor, Representative
from .serializers import (
    CustomerSerializer,
    CustomUserSerializer,
    DoctorSerializer,
    RepresentativeSerializer,
)


class CustomUserViewSet(ModelViewSet):
    serializer_class = CustomUserSerializer
    queryset = CustomUser.objects.all()


class CustomerViewSet(ModelViewSet):
    serializer_class = CustomerSerializer
    queryset = Customer.objects.all()


class DoctorViewSet(ModelViewSet):
    serializer_class = DoctorSerializer
    queryset = Doctor.objects.all()


class RepresentativeViewSet(ModelViewSet):
    serializer_class = RepresentativeSerializer
    queryset = Representative.objects.all()
