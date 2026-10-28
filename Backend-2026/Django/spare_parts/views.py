from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from authentication.permissions import HasResourceAccess
from spare_parts.models import SparePart
from spare_parts.serializers import SparePartSerializer


class SparePartViewSet(viewsets.ModelViewSet):
    queryset = SparePart.objects.all()
    serializer_class = SparePartSerializer
    permission_classes = [IsAuthenticated, HasResourceAccess]
