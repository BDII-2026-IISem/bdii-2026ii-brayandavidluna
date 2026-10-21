from rest_framework import serializers
from sales.models import ProductSale, Sale


class ProductSaleSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductSale
        fields = ["product", "quantity", "unit_price", "subtotal"]


class SaleSerializer(serializers.ModelSerializer):
    items = ProductSaleSerializer(many=True, read_only=True)

    class Meta:
        model = Sale
        fields = ["id", "client", "total_amount", "status", "sale_date", "items"]


class ItemRegisterSerializer(serializers.Serializer):
    product_id = serializers.IntegerField(min_value=1)
    quantity = serializers.IntegerField(min_value=1)


class RegisterSaleSerializer(serializers.Serializer):
    client_id = serializers.IntegerField(min_value=1)
    items = ItemRegisterSerializer(many=True, allow_empty=False)