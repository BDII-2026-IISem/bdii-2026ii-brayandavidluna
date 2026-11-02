from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from drf_spectacular.utils import extend_schema

from authentication.models import (
    CustomUser,
    Resource,
    ResourceRole,
    Role,
    RoleUser,
)
from authentication.permissions import (
    HasResourceAccess,
    effective_permissions_for_user,
)
from authentication.serializers import (
    CustomTokenObtainPairSerializer,
    LogoutRequestSerializer,
    MessageSerializer,
    UserAdminSerializer,
    UserProfileSerializer,
    RoleSerializer,
    ResourceSerializer,
    RoleUserSerializer,
    ResourceRoleSerializer,
)


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class LogoutAPIView(APIView):
    @extend_schema(
        request=LogoutRequestSerializer,
        responses={205: MessageSerializer, 400: MessageSerializer},
    )
    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not isinstance(refresh_token, str) or not refresh_token:
            return Response(
                {"detail": "Token inválido o no proporcionado."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            token = RefreshToken(refresh_token)
        except TokenError:
            return Response(
                {"detail": "Token inválido o no proporcionado."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        token.blacklist()
        return Response(
            {"detail": "Sesión cerrada correctamente."},
            status=status.HTTP_205_RESET_CONTENT,
        )


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated, HasResourceAccess]

    @extend_schema(responses=UserProfileSerializer)
    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class EffectivePermissionsView(APIView):
    permission_classes = [IsAuthenticated, HasResourceAccess]

    def get(self, request):
        return Response(
            {"permissions": effective_permissions_for_user(request.user)},
            status=status.HTTP_200_OK,
        )


# --- ViewSets del ISS-23: CRUD de la Matriz RBAC ---
class UserAdminViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all().order_by("username")
    serializer_class = UserAdminSerializer
    permission_classes = [IsAuthenticated, HasResourceAccess]

    def perform_destroy(self, instance):
        if instance.pk == self.request.user.pk:
            raise ValidationError(
                {"detail": "No se puede eliminar el usuario de la sesión actual."}
            )
        instance.delete()

    def perform_update(self, serializer):
        if (
            serializer.instance.pk == self.request.user.pk
            and serializer.validated_data.get("is_active") is False
        ):
            raise ValidationError(
                {"is_active": "No se puede desactivar el usuario de la sesión actual."}
            )
        serializer.save()

    @action(detail=True, methods=["get"], url_path="permissions")
    def permissions(self, request, pk=None):
        user = self.get_object()
        return Response(
            {"permissions": effective_permissions_for_user(user)},
            status=status.HTTP_200_OK,
        )


class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated, HasResourceAccess]


class ResourceViewSet(viewsets.ModelViewSet):
    queryset = Resource.objects.all()
    serializer_class = ResourceSerializer
    permission_classes = [IsAuthenticated, HasResourceAccess]


class RoleUserViewSet(viewsets.ModelViewSet):
    queryset = RoleUser.objects.all()
    serializer_class = RoleUserSerializer
    permission_classes = [IsAuthenticated, HasResourceAccess]


class ResourceRoleViewSet(viewsets.ModelViewSet):
    queryset = ResourceRole.objects.all()
    serializer_class = ResourceRoleSerializer
    permission_classes = [IsAuthenticated, HasResourceAccess]