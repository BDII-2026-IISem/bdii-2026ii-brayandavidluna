from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from authentication.permissions import HasResourceAccess
from technicians.models import Technician
from technicians.serializers import TechnicianSerializer


class TechnicianViewSet(viewsets.ModelViewSet):
    queryset = Technician.objects.all()
    serializer_class = TechnicianSerializer
    permission_classes = [IsAuthenticated, HasResourceAccess]
