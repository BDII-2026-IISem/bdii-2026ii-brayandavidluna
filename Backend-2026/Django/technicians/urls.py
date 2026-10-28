from rest_framework.routers import DefaultRouter

from technicians.views import TechnicianViewSet

router = DefaultRouter()
router.register(r"technicians", TechnicianViewSet, basename="technician")

urlpatterns = router.urls
