from rest_framework import serializers

from payments.models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    client_name = serializers.SerializerMethodField()
    technician_name = serializers.SerializerMethodField()
    registered_by_username = serializers.CharField(
        source="registered_by.username",
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = Payment
        fields = "__all__"
        read_only_fields = ("reference_type", "reference_id", "registered_by")

    def get_client_name(self, payment):
        if payment.service_order_id:
            return payment.service_order.client.name
        return None

    def get_technician_name(self, payment):
        if payment.service_order_id:
            return payment.service_order.technician.name
        return None

    def validate(self, attrs):
        if self.instance is None and not attrs.get("service_order"):
            raise serializers.ValidationError(
                {"service_order": "Seleccione la orden asociada al pago."}
            )
        return attrs
