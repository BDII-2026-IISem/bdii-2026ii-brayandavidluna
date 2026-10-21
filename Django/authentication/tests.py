from types import SimpleNamespace
from unittest.mock import patch

from django.test import SimpleTestCase
from django.test.client import RequestFactory
from django.contrib.auth import get_user_model

from authentication.models import ResourceRole
from authentication.permissions import HasResourceAccess


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
