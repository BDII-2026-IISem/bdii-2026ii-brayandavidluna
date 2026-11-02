from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from authentication.permissions import HasResourceAccess
from authentication.mixins import ClientScopedQuerysetMixin
from payments.models import Payment
from payments.serializers import PaymentSerializer


class PaymentViewSet(ClientScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = Payment.objects.select_related(
        "service_order__client", "registered_by"
    ).all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated, HasResourceAccess]
    client_scope_lookup = "service_order__client__user"

    def perform_create(self, serializer):
        serializer.save(registered_by=self.request.user)
