from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from service_orders.models import (
    Diagnosis,
    Quote,
    ServiceOrder,
    SparePartConsumption,
    Warranty,
)


class ServiceOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceOrder
        fields = "__all__"


class DiagnosisSerializer(serializers.ModelSerializer):
    technician_name = serializers.CharField(
        source="service_order.technician.name",
        read_only=True,
    )

    class Meta:
        model = Diagnosis
        fields = "__all__"


class SparePartConsumptionSerializer(serializers.ModelSerializer):
    technician_name = serializers.CharField(
        source="service_order.technician.name",
        read_only=True,
    )

    class Meta:
        model = SparePartConsumption
        fields = "__all__"

    def create(self, validated_data):
        try:
            return super().create(validated_data)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(
                exc.message_dict if hasattr(exc, "message_dict") else exc.messages
            ) from exc

    def update(self, instance, validated_data):
        try:
            return super().update(instance, validated_data)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(
                exc.message_dict if hasattr(exc, "message_dict") else exc.messages
            ) from exc


class QuoteSerializer(serializers.ModelSerializer):
    technician_name = serializers.CharField(
        source="service_order.technician.name",
        read_only=True,
    )

    class Meta:
        model = Quote
        fields = "__all__"


class WarrantySerializer(serializers.ModelSerializer):
    technician_name = serializers.CharField(
        source="service_order.technician.name",
        read_only=True,
    )

    class Meta:
        model = Warranty
        fields = "__all__"
