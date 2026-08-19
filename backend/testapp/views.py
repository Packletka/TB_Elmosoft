from rest_framework.viewsets import ModelViewSet

from .models import Talon
from .serializers import TalonSerializer


class TalonViewSet(ModelViewSet):
    serializer_class = TalonSerializer
    queryset = Talon.objects.all()
