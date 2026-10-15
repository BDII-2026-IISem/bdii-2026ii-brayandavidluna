from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken

from authentication.models import Role, Resource, RoleUser, ResourceRole
from authentication.permissions import HasResourceAccess
from authentication.serializers import (
    CustomTokenObtainPairSerializer,
    UserProfileSerializer,
    RoleSerializer,
    ResourceSerializer,
    RoleUserSerializer,
    ResourceRoleSerializer,
)


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class LogoutAPIView(APIView):
    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"detail": "Sesión cerrada correctamente."}, status=status.HTTP_205_RESET_CONTENT)
        except Exception:
            return Response({"detail": "Token inválido o no proporcionado."}, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)


# --- ViewSets del ISS-23: CRUD de la Matriz RBAC ---
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