from rest_framework.viewsets import ModelViewSet

from .models import Talons
from .serializers import TalonsSerializer


class TalonViewSet(ModelViewSet):
    serializer_class = TalonsSerializer
    queryset = Talons.objects.all()
