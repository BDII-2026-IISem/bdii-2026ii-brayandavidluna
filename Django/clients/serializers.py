from rest_framework import serializers
from clients.models import Client


class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = [
            "id",
            "first_name",
            "last_name",
            "document_type",
            "document_number",
            "email",
            "phone",
            "address",
            "is_active",
            "created_at",
            "updated_at",
        ]