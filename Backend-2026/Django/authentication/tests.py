from types import SimpleNamespace
from unittest.mock import patch

from django.test import SimpleTestCase
from django.test.client import RequestFactory
from django.template.loader import render_to_string
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.contrib import admin
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.token_blacklist.models import (
    BlacklistedToken,
    OutstandingToken,
)
from rest_framework_simplejwt.tokens import AccessToken

from authentication.models import ResourceRole
from authentication.permissions import HasResourceAccess


class AdminSpanishLabelsTests(SimpleTestCase):
    def test_groups_and_token_models_are_hidden_from_admin(self):
        for model in (Group, BlacklistedToken, OutstandingToken):
            with self.subTest(model=model.__name__):
                self.assertFalse(admin.site.is_registered(model))

    def test_submit_buttons_are_in_spanish(self):
        rendered = render_to_string(
            "admin/submit_line.html",
            {
                "show_save": True,
                "show_save_as_new": True,
                "show_save_and_add_another": True,
                "show_save_and_continue": True,
                "can_change": True,
                "show_close": False,
                "show_delete_link": False,
                "original": None,
            },
        )

        for label in (
            "Guardar",
            "Guardar como nuevo",
            "Guardar y añadir otro",
            "Guardar y continuar editando",
        ):
            with self.subTest(label=label):
                self.assertIn(label, rendered)

        self.assertNotIn("Grabar", rendered)
        self.assertNotIn("Save", rendered)


class HasResourceAccessTests(SimpleTestCase):
    def test_permission_queries_existing_resource_role_relations(self):
        user = get_user_model()(pk=1)
        request = RequestFactory().get("/api/v1/auth/me/")
        request.user = user
        expected_filters = {
            "resource__path": "/api/v1/auth/me/",
            "resource__method": "GET",
            "role__role_users__user": user,
        }

        with patch.object(
            ResourceRole.objects,
            "filter",
            return_value=SimpleNamespace(exists=lambda: True),
        ) as filter_resources:
            allowed = HasResourceAccess().has_permission(request, view=None)

        self.assertTrue(allowed)
        filter_resources.assert_called_once_with(**expected_filters)

    def test_permission_rejects_unauthenticated_user(self):
        request = RequestFactory().get("/api/v1/auth/me/")
        request.user = SimpleNamespace(is_authenticated=False)

        with patch.object(ResourceRole.objects, "filter") as filter_resources:
            allowed = HasResourceAccess().has_permission(request, view=None)

        self.assertFalse(allowed)
        filter_resources.assert_not_called()

    def test_permission_denies_user_without_matching_resource_role(self):
        request = RequestFactory().get("/api/v1/auth/me/")
        request.user = get_user_model()(pk=1)

        with patch.object(
            ResourceRole.objects,
            "filter",
            return_value=SimpleNamespace(exists=lambda: False),
        ):
            allowed = HasResourceAccess().has_permission(request, view=None)

        self.assertFalse(allowed)

    def test_permission_filter_compiles_against_rbac_schema(self):
        user = get_user_model()(pk=1)
        queryset = ResourceRole.objects.filter(
            resource__path="/api/v1/auth/me/",
            resource__method="GET",
            role__role_users__user=user,
        )

        sql, params = queryset.query.sql_with_params()

        self.assertIn("resource", sql)
        self.assertIn("role_users", sql)
        self.assertEqual(params, ("GET", "/api/v1/auth/me/", 1))


class ResourceAccessResponseTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="rbac-user",
            password="test-password",
        )
        self.url = "/api/v1/auth/me/"

    def test_protected_endpoint_returns_401_without_credentials(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_protected_endpoint_returns_403_without_rbac_permission(self):
        token = AccessToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
