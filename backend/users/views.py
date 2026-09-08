from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
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

        if hasattr(user, "customer"):
            serializer_class = CustomerUpdateSerializer
        elif hasattr(user, "doctor"):
            serializer_class = DoctorUpdateSerializer
        elif hasattr(user, "representative"):
            serializer_class = RepresentativeUpdateSerializer
        else:
            serializer_class = UserUpdateSerializer

        serializer = serializer_class(
            instance=user, data=request.data, partial=request.method == "PATCH", context={"request": request}
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

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [AllowAny()]

        return [IsAdminOrRepresentativeForDoctor()]

    def get_queryset(self):
        queryset = Doctor.objects.select_related(
            "user",
            "health_organisation",
        ).order_by("id")

        if self.action == "list":
            health_organisation_id = self._get_positive_int_query_param(
                "health_organisation",
            )

            if health_organisation_id is not None:
                queryset = queryset.filter(
                    health_organisation_id=health_organisation_id,
                )

            return queryset

        if self.action == "retrieve":
            return queryset

        user = self.request.user

        # If representative -> manage only doctors from their organization
        if user.is_authenticated and hasattr(user, "representative"):
            rep_org = user.representative.health_organisation
            return queryset.filter(health_organisation=rep_org)

        return queryset

    def _get_positive_int_query_param(self, name):
        value = self.request.query_params.get(name, "")

        if not value:
            return None

        try:
            parsed_value = int(value)
        except ValueError as exc:
            raise ValidationError({name: "Must be a valid integer."}) from exc

        if parsed_value <= 0:
            raise ValidationError({name: "Must be a positive integer."})

        return parsed_value


class RepresentativeViewSet(ModelViewSet):
    serializer_class = RepresentativeSerializer
    queryset = Representative.objects.all()

    permission_classes = (IsAdminUser,)
