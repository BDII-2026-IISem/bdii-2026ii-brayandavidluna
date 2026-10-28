from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from authentication.permissions import HasResourceAccess
from service_orders.models import (
    Diagnosis,
    Quote,
    ServiceOrder,
    SparePartConsumption,
    Warranty,
)
from service_orders.serializers import (
    DiagnosisSerializer,
    QuoteSerializer,
    ServiceOrderSerializer,
    SparePartConsumptionSerializer,
    WarrantySerializer,
)


class ServiceOrderViewSet(viewsets.ModelViewSet):
    queryset = ServiceOrder.objects.select_related("client", "equipment", "technician").all()
    serializer_class = ServiceOrderSerializer
    permission_classes = [IsAuthenticated, HasResourceAccess]


class DiagnosisViewSet(viewsets.ModelViewSet):
    queryset = Diagnosis.objects.select_related("service_order").all()
    serializer_class = DiagnosisSerializer
    permission_classes = [IsAuthenticated, HasResourceAccess]


class SparePartConsumptionViewSet(viewsets.ModelViewSet):
    queryset = SparePartConsumption.objects.select_related(
        "service_order", "spare_part"
    ).all()
    serializer_class = SparePartConsumptionSerializer
    permission_classes = [IsAuthenticated, HasResourceAccess]


class QuoteViewSet(viewsets.ModelViewSet):
    queryset = Quote.objects.select_related("service_order").all()
    serializer_class = QuoteSerializer
    permission_classes = [IsAuthenticated, HasResourceAccess]


class WarrantyViewSet(viewsets.ModelViewSet):
    queryset = Warranty.objects.select_related("service_order").all()
    serializer_class = WarrantySerializer
    permission_classes = [IsAuthenticated, HasResourceAccess]
