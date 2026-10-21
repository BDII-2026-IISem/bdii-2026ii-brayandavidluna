from rest_framework import generics, viewsets
from rest_framework.permissions import IsAuthenticated
from authentication.permissions import HasResourceAccess
from products.models import Product, ProductType
from products.serializers import ProductSerializer, ProductTypeSerializer


class ProductTypeViewSet(viewsets.ModelViewSet):
    queryset = ProductType.objects.all()
    serializer_class = ProductTypeSerializer
    permission_classes = [IsAuthenticated, HasResourceAccess]


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated, HasResourceAccess]


class AvailableProductsListView(generics.ListAPIView):
    queryset = Product.objects.filter(is_active=True, stock__gt=0)
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated, HasResourceAccess]