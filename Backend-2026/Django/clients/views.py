from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from authentication.permissions import HasResourceAccess
from authentication.mixins import ClientScopedQuerysetMixin
from clients.models import Client
from clients.serializers import ClientSerializer


class ClientViewSet(ClientScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated, HasResourceAccess]
    client_scope_lookup = "user"