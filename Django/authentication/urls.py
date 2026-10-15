from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from authentication.views import (
    CustomTokenObtainPairView,
    LogoutAPIView,
    UserProfileView,
)

urlpatterns = [
    path("auth/login/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/logout/", LogoutAPIView.as_view(), name="auth_logout"),
    path("auth/me/", UserProfileView.as_view(), name="user_profile"),
]