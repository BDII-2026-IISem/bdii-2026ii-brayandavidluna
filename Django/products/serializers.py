from rest_framework import serializers
from products.models import Product, ProductType


class ProductTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductType
        fields = ["id", "name", "description", "is_active", "created_at", "updated_at"]


class ProductSerializer(serializers.ModelSerializer):
    product_type_detail = ProductTypeSerializer(source="product_type", read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "product_type",
            "product_type_detail",
            "name",
            "code",
            "price",
            "stock",
            "is_active",
            "created_at",
            "updated_at",
        ]