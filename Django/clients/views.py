from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from authentication.permissions import HasResourceAccess
from clients.models import Client
from clients.serializers import ClientSerializer


class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated, HasResourceAccess]