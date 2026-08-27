from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from .models import Customer, CustomUser, Doctor, Representative
from .permissions import IsAdminOrRepresentativeForDoctor
from .serializers import (
    CustomerSerializer,
    CustomerUpdateSerializer,
    CustomUserSerializer,
    DoctorSerializer,
    DoctorUpdateSerializer,
    MeSerializer,
    RegisterSerializer,
    RepresentativeSerializer,
    RepresentativeUpdateSerializer,
    UserUpdateSerializer,
)


class CustomUserViewSet(
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    lookup_value_regex = "[0-9]+"
    serializer_class = CustomUserSerializer
    queryset = CustomUser.objects.all()

    def get_permissions(self):
        print(f"DEBUG: action = {self.action}")
        if self.action == "register":
            return [AllowAny()]
        elif self.action in ["me", "update_me", "delete_me"]:
            return [IsAuthenticated()]
        return [IsAdminUser()]

    @action(detail=False, methods=["POST"])
    def register(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["GET"])
    def me(self, request):
        serializer = MeSerializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=["PUT", "PATCH"])
    def update_me(self, request):
        user = request.user
        print(f"DEBUG: User={user.email}, has_customer={hasattr(user, 'customer')}")

        if hasattr(user, "customer"):
            serializer_class = CustomerUpdateSerializer
        elif hasattr(user, "doctor"):
            serializer_class = DoctorUpdateSerializer
        elif hasattr(user, "representative"):
            serializer_class = RepresentativeUpdateSerializer
        else:
            serializer_class = UserUpdateSerializer

        print(f"DEBUG: serializer_class={serializer_class.__name__}")

        print(f"DEBUG: class has update() = {hasattr(serializer_class, 'update')}")

        serializer = serializer_class(
            instance=user, data=request.data, partial=request.method == "PATCH", context={"request": request}
        )

        print(f"DEBUG: instance has update() = {hasattr(serializer, 'update')}")
        print(f"DEBUG: instance type = {type(serializer)}")

        if hasattr(serializer, "update"):
            print(f"DEBUG: update method = {serializer.update}")
        else:
            print("DEBUG: update method is MISSING on instance!")

        serializer.is_valid(raise_exception=True)
        print(f"DEBUG: valid data = {serializer.validated_data}")

        result = serializer.save()
        print(f"DEBUG: save result = {result}")

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
    permission_classes = (IsAdminOrRepresentativeForDoctor,)

    def get_queryset(self):
        user = self.request.user
        queryset = Doctor.objects.all()

        # If representative -> filter to their organization
        if user.is_authenticated and hasattr(user, "representative"):
            rep_org = user.representative.health_organisation
            queryset = queryset.filter(health_organisation=rep_org)

        return queryset


class RepresentativeViewSet(ModelViewSet):
    serializer_class = RepresentativeSerializer
    queryset = Representative.objects.all()

    permission_classes = (IsAdminUser,)
