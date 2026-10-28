from rest_framework.routers import DefaultRouter

from service_orders.views import (
    DiagnosisViewSet,
    QuoteViewSet,
    ServiceOrderViewSet,
    SparePartConsumptionViewSet,
    WarrantyViewSet,
)

router = DefaultRouter()
router.register(r"service-orders", ServiceOrderViewSet, basename="service-order")
router.register(r"diagnoses", DiagnosisViewSet, basename="diagnosis")
router.register(
    r"spare-part-consumptions",
    SparePartConsumptionViewSet,
    basename="spare-part-consumption",
)
router.register(r"quotes", QuoteViewSet, basename="quote")
router.register(r"warranties", WarrantyViewSet, basename="warranty")

urlpatterns = router.urls
