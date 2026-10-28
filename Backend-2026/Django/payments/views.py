from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from authentication.permissions import HasResourceAccess
from payments.models import Payment
from payments.serializers import PaymentSerializer


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.select_related(
        "service_order__client", "registered_by"
    ).all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated, HasResourceAccess]

    def perform_create(self, serializer):
        serializer.save(registered_by=self.request.user)
