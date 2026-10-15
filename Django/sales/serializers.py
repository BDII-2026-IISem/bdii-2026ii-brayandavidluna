from rest_framework import serializers
from sales.models import ProductSale, Sale


class ProductSaleSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductSale
        fields = ["product", "quantity", "unit_price", "subtotal"]


class SaleSerializer(serializers.ModelSerializer):
    items = ProductSaleSerializer(source="product_sales", many=True, read_only=True)

    class Meta:
        model = Sale
        fields = ["id", "client", "total", "status", "created_at", "items"]


class ItemRegisterSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField()


class RegisterSaleSerializer(serializers.Serializer):
    client_id = serializers.IntegerField()
    items = ItemRegisterSerializer(many=True)