from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from authentication.permissions import HasResourceAccess
from sales.models import Sale
from sales.serializers import RegisterSaleSerializer, SaleSerializer


class RegisterSaleAPIView(APIView):
    permission_classes = [IsAuthenticated, HasResourceAccess]

    def post(self, request):
        serializer = RegisterSaleSerializer(data=request.data)
        if serializer.is_valid():
            # Lógica de creación de la venta
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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
        try:
            sale = Sale.objects.get(pk=pk)
            sale.status = "CANCELLED"
            sale.save()
            return Response(
                {"detail": "Venta anulada correctamente."}, status=status.HTTP_200_OK
            )
        except Sale.DoesNotExist:
            return Response(
                {"detail": "Venta no encontrada."}, status=status.HTTP_404_NOT_FOUND
            )