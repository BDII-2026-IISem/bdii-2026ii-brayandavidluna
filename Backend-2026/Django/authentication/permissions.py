from rest_framework import permissions
from authentication.models import ResourceRole


class HasResourceAccess(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        path = request.path
        method = request.method

        return ResourceRole.objects.filter(
            resource__path=path,
            resource__method=method,
            role__role_users__user=request.user,
        ).exists()