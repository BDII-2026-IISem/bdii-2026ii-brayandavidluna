from django.db import transaction
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from clients.models import Client
from products.models import Product
from sales.models import ProductSale, Sale
from sales.serializers import CreateSaleSerializer, SaleSerializer
from rest_framework import generics

class RegisterSaleAPIView(APIView):
    @transaction.atomic
    def post(self, request):
        serializer = CreateSaleSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        client_id = serializer.validated_data["client_id"]
        items_data = serializer.validated_data["items"]

        try:
            client = Client.objects.get(id=client_id, is_active=True)
        except Client.DoesNotExist:
            return Response(
                {"detail": "Cliente no encontrado o inactivo."},
                status=status.HTTP_404_NOT_FOUND,
            )

        sale = Sale.objects.create(client=client, total_amount=0)
        total_amount = 0

        for item in items_data:
            try:
                product = Product.objects.get(id=item["product_id"], is_active=True)
            except Product.DoesNotExist:
                transaction.set_rollback(True)
                return Response(
                    {"detail": f"Producto con id {item['product_id']} no existe."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if product.stock < item["quantity"]:
                transaction.set_rollback(True)
                return Response(
                    {"detail": f"Stock insuficiente para {product.name}."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            subtotal = product.price * item["quantity"]
            total_amount += subtotal
            product.stock -= item["quantity"]
            product.save()

            ProductSale.objects.create(
                sale=sale,
                product=product,
                quantity=item["quantity"],
                unit_price=product.price,
                subtotal=subtotal,
            )

        sale.total_amount = total_amount
        sale.save()

        response_serializer = SaleSerializer(sale)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

class SaleListView(generics.ListAPIView):
    queryset = Sale.objects.all()
    serializer_class = SaleSerializer


class SaleDetailView(generics.RetrieveAPIView):
    queryset = Sale.objects.all()
    serializer_class = SaleSerializer


class CancelSaleAPIView(APIView):
    @transaction.atomic
    def post(self, request, pk):
        try:
            sale = Sale.objects.get(pk=pk)
        except Sale.DoesNotExist:
            return Response(
                {"detail": "Venta no encontrada."}, status=status.HTTP_404_NOT_FOUND
            )

        if sale.status == "CANCELLED":
            return Response(
                {"detail": "La venta ya se encuentra anulada."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        for item in sale.items.all():
            product = item.product
            product.stock += item.quantity
            product.save()

        sale.status = "CANCELLED"
        sale.save()

        serializer = SaleSerializer(sale)
        return Response(serializer.data, status=status.HTTP_200_OK)