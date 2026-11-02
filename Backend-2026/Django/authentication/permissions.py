from rest_framework import permissions
from authentication.models import ResourceRole


class HasResourceAccess(permissions.BasePermission):
    @staticmethod
    def _path_matches(resource_path, request_path):
        resource_segments = resource_path.split("/")
        request_segments = request_path.split("/")
        if len(resource_segments) != len(request_segments):
            return False

        return all(
            request_segment.isascii() and request_segment.isdecimal()
            if resource_segment == "<int:pk>"
            else resource_segment == request_segment
            for resource_segment, request_segment in zip(
                resource_segments, request_segments
            )
        )

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        resource_paths = ResourceRole.objects.filter(
            resource__method=request.method,
            role__role_users__user=request.user,
        ).values_list("resource__path", flat=True).distinct()

        return any(
            self._path_matches(resource_path, request.path)
            for resource_path in resource_paths
        )