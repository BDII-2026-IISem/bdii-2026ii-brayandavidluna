from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from authentication.permissions import HasResourceAccess
from equipment.models import Equipment
from equipment.serializers import EquipmentSerializer


class EquipmentViewSet(viewsets.ModelViewSet):
    queryset = Equipment.objects.select_related("client").all()
    serializer_class = EquipmentSerializer
    permission_classes = [IsAuthenticated, HasResourceAccess]
