from rest_framework import permissions
from authentication.models import ResourceRole


class HasResourceAccess(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        path = request.path
        method = request.method

        user_roles = request.user.user_roles.filter(is_active="ACTIVE").values_list(
            "role_id", flat=True
        )

        has_access = ResourceRole.objects.filter(
            resource__path=path,
            resource__method=method,
            resource__is_active="ACTIVE",
            role_id__in=user_roles,
            role__is_active="ACTIVE",
            is_active="ACTIVE",
        ).exists()

        return has_access