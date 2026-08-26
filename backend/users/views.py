from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from .models import Customer, CustomUser, Doctor, Representative
from .serializers import (
    CustomerSerializer,
    CustomUserSerializer,
    DoctorSerializer,
    MeSerializer,
    RegisterSerializer,
    RepresentativeSerializer,
    UpdateMeSerializer,
)


class CustomUserViewSet(
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = CustomUserSerializer
    queryset = CustomUser.objects.all()

    def get_permissions(self):
        if self.action == "register":
            return [AllowAny()]
        elif self.action in ["me", "update_me", "delete_me"]:
            return [IsAuthenticated()]
        return [IsAdminUser()]

    @action(detail=False, methods=["POST"])
    def register(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["GET"])
    def me(self, request):
        serializer = MeSerializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=["PUT", "PATCH"])
    def update_me(self, request):
        serializer = UpdateMeSerializer(
            instance=request.user, data=request.data, partial=request.method == "PATCH", context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=False, methods=["DELETE"])
    def delete_me(self, request):
        user = request.user
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CustomerViewSet(
    mixins.RetrieveModelMixin, mixins.UpdateModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet
):
    serializer_class = CustomerSerializer
    queryset = Customer.objects.all()

    permission_classes = (IsAdminUser,)


class DoctorViewSet(ModelViewSet):
    serializer_class = DoctorSerializer
    queryset = Doctor.objects.all()

    permission_classes = (IsAdminUser,)


class RepresentativeViewSet(ModelViewSet):
    serializer_class = RepresentativeSerializer
    queryset = Representative.objects.all()

    permission_classes = (IsAdminUser,)
