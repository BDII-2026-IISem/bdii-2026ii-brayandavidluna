from rest_framework.routers import DefaultRouter

from spare_parts.views import SparePartViewSet

router = DefaultRouter()
router.register(r"spare-parts", SparePartViewSet, basename="spare-part")

urlpatterns = router.urls
