from decimal import Decimal

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import AccessToken

from authentication.models import Resource, ResourceRole, Role, RoleUser
from spare_parts.models import SparePart


class AvailableSparePartApiTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="parts-admin",
            email="parts-admin@example.com",
            password="test-password",
        )
        admin_role = Role.objects.create(name="ADMIN")
        RoleUser.objects.create(user=self.user, role=admin_role)
        resource = Resource.objects.create(
            path="/api/v1/spare-parts/available/",
            method="GET",
            description="Consultar repuestos disponibles",
        )
        ResourceRole.objects.create(resource=resource, role=admin_role)
        token = AccessToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def test_available_endpoint_returns_only_active_parts_with_stock(self):
        available = SparePart.objects.create(
            name="Compresor",
            price=Decimal("125.00"),
            stock=2,
            status="ACTIVE",
        )
        SparePart.objects.create(
            name="Filtro sin existencias",
            price=Decimal("15.00"),
            stock=0,
            status="ACTIVE",
        )
        SparePart.objects.create(
            name="Repuesto inactivo",
            price=Decimal("20.00"),
            stock=5,
            status="INACTIVE",
        )

        response = self.client.get("/api/v1/spare-parts/available/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([item["id"] for item in response.data], [available.pk])

    def test_available_endpoint_requires_authentication_and_rbac(self):
        self.client.credentials()
        response = self.client.get("/api/v1/spare-parts/available/")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(user=self.user)
        ResourceRole.objects.all().delete()
        denied = self.client.get("/api/v1/spare-parts/available/")

        self.assertEqual(denied.status_code, status.HTTP_403_FORBIDDEN)
