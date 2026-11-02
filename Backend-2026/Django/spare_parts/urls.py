from django.urls import path
from rest_framework.routers import DefaultRouter

from spare_parts.views import AvailableSparePartListAPIView, SparePartViewSet

router = DefaultRouter()
router.register(r"spare-parts", SparePartViewSet, basename="spare-part")

urlpatterns = [
    path(
        "spare-parts/available/",
        AvailableSparePartListAPIView.as_view(),
        name="spare-part-available",
    ),
]
urlpatterns += router.urls
