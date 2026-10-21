from django.db import transaction
from rest_framework import generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from authentication.permissions import HasResourceAccess
from clients.models import Client
from products.models import Product
from sales.models import ProductSale, Sale
from sales.serializers import RegisterSaleSerializer, SaleSerializer


class RegisterSaleAPIView(APIView):
    permission_classes = [IsAuthenticated, HasResourceAccess]

    def post(self, request):
        serializer = RegisterSaleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        sale_data = serializer.validated_data

        with transaction.atomic():
            try:
                client = Client.objects.get(pk=sale_data["client_id"])
            except Client.DoesNotExist as exc:
                raise ValidationError({"client_id": "El cliente no existe."}) from exc

            sale = Sale.objects.create(client=client)
            total_amount = 0

            for item in sale_data["items"]:
                try:
                    product = Product.objects.select_for_update().get(
                        pk=item["product_id"],
                        is_active=True,
                    )
                except Product.DoesNotExist as exc:
                    raise ValidationError(
                        {
                            "items": [
                                f"El producto {item['product_id']} no existe o está inactivo."
                            ]
                        }
                    ) from exc

                if product.stock < item["quantity"]:
                    raise ValidationError(
                        {
                            "items": [
                                f"Stock insuficiente para el producto {product.name}."
                            ]
                        }
                    )

                quantity = item["quantity"]
                subtotal = product.price * quantity
                product.stock -= quantity
                product.save(update_fields=["stock", "updated_at"])
                ProductSale.objects.create(
                    sale=sale,
                    product=product,
                    quantity=quantity,
                    unit_price=product.price,
                    subtotal=subtotal,
                )
                total_amount += subtotal

            sale.total_amount = total_amount
            sale.save(update_fields=["total_amount", "updated_at"])

        return Response(SaleSerializer(sale).data, status=status.HTTP_201_CREATED)


class SaleListView(generics.ListAPIView):
    queryset = Sale.objects.all()
    serializer_class = SaleSerializer
    permission_classes = [IsAuthenticated, HasResourceAccess]


class SaleDetailView(generics.RetrieveAPIView):
    queryset = Sale.objects.all()
    serializer_class = SaleSerializer
    permission_classes = [IsAuthenticated, HasResourceAccess]


class CancelSaleAPIView(APIView):
    permission_classes = [IsAuthenticated, HasResourceAccess]

    def post(self, request, pk):
        with transaction.atomic():
            try:
                sale = Sale.objects.select_for_update().get(pk=pk)
            except Sale.DoesNotExist:
                return Response(
                    {"detail": "Venta no encontrada."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            if sale.status == "CANCELLED":
                return Response(
                    {"detail": "La venta ya se encuentra anulada."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            for item in sale.items.all():
                product = Product.objects.select_for_update().get(pk=item.product_id)
                product.stock += item.quantity
                product.save(update_fields=["stock", "updated_at"])

            sale.status = "CANCELLED"
            sale.save(update_fields=["status", "updated_at"])

        return Response(
            {"detail": "Venta anulada correctamente."}, status=status.HTTP_200_OK
        )