from rest_framework import serializers
from sales.models import ProductSale, Sale


class ProductSaleSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = ProductSale
        fields = ["id", "product", "product_name", "quantity", "unit_price", "subtotal"]


class SaleSerializer(serializers.ModelSerializer):
    items = ProductSaleSerializer(many=True, read_only=True)
    client_name = serializers.SerializerMethodField()

    class Meta:
        model = Sale
        fields = [
            "id",
            "client",
            "client_name",
            "sale_date",
            "total_amount",
            "status",
            "items",
            "created_at",
            "updated_at",
        ]

    def get_client_name(self, obj):
        return f"{obj.client.first_name} {obj.client.last_name}"


class CreateSaleItemSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)


class CreateSaleSerializer(serializers.Serializer):
    client_id = serializers.IntegerField()
    items = CreateSaleItemSerializer(many=True)