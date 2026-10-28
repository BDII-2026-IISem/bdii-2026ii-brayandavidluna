from rest_framework import serializers
from clients.models import Client


class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = [
            "id",
            "document_type",
            "document_number",
            "name",
            "email",
            "phone",
            "address",
            "is_active",
            "created_at",
            "updated_at",
        ]