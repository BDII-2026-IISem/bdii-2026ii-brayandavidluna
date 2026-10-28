from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from authentication.views import (
    CustomTokenObtainPairView,
    LogoutAPIView,
    UserProfileView,
    RoleViewSet,
    ResourceViewSet,
    RoleUserViewSet,
    ResourceRoleViewSet,
)

router = DefaultRouter()
router.register(r"roles", RoleViewSet, basename="role")
router.register(r"resources", ResourceViewSet, basename="resource")
router.register(r"role-users", RoleUserViewSet, basename="role-user")
router.register(r"resource-roles", ResourceRoleViewSet, basename="resource-role")

urlpatterns = [
    path("auth/login/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/logout/", LogoutAPIView.as_view(), name="auth_logout"),
    path("auth/me/", UserProfileView.as_view(), name="user_profile"),
    path("", include(router.urls)),
]