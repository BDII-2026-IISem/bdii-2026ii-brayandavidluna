from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from authentication.permissions import HasResourceAccess
from authentication.mixins import ClientScopedQuerysetMixin
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


class ServiceOrderViewSet(ClientScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = ServiceOrder.objects.select_related("client", "equipment", "technician").all()
    serializer_class = ServiceOrderSerializer
    permission_classes = [IsAuthenticated, HasResourceAccess]


class DiagnosisViewSet(ClientScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = Diagnosis.objects.select_related("service_order").all()
    serializer_class = DiagnosisSerializer
    permission_classes = [IsAuthenticated, HasResourceAccess]
    client_scope_lookup = "service_order__client__user"


class SparePartConsumptionViewSet(
    ClientScopedQuerysetMixin, viewsets.ModelViewSet
):
    queryset = SparePartConsumption.objects.select_related(
        "service_order", "spare_part"
    ).all()
    serializer_class = SparePartConsumptionSerializer
    permission_classes = [IsAuthenticated, HasResourceAccess]
    client_scope_lookup = "service_order__client__user"


class QuoteViewSet(ClientScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = Quote.objects.select_related("service_order").all()
    serializer_class = QuoteSerializer
    permission_classes = [IsAuthenticated, HasResourceAccess]
    client_scope_lookup = "service_order__client__user"


class WarrantyViewSet(ClientScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = Warranty.objects.select_related("service_order").all()
    serializer_class = WarrantySerializer
    permission_classes = [IsAuthenticated, HasResourceAccess]
    client_scope_lookup = "service_order__client__user"
