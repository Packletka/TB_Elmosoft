from rest_framework.permissions import BasePermission


class IsAdminOrRepresentativeForDoctor(BasePermission):
    def has_permission(self, request, view):
        is_authorized = False

        if request.user and request.user.is_staff or request.user and hasattr(request.user, "representative"):
            is_authorized = True

        return is_authorized

    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True
        if hasattr(request.user, "representative"):
            # True if representative is from exact correct organisation
            rep_org = request.user.representative.health_organisation
            return obj.health_organisation == rep_org
        return False
