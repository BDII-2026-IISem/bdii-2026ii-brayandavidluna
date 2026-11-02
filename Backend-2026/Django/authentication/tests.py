from types import SimpleNamespace
from unittest.mock import patch

from django.test import SimpleTestCase, TestCase
from django.test.client import RequestFactory
from django.template.loader import render_to_string
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.contrib import admin
from django.core.management import call_command
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.token_blacklist.models import (
    BlacklistedToken,
    OutstandingToken,
)
from rest_framework_simplejwt.tokens import AccessToken

from authentication.models import CustomUser, Resource, ResourceRole, Role, RoleUser
from authentication.permissions import HasResourceAccess
from clients.models import Client
from authentication.admin import CustomUserAdmin, CustomUserCreationForm


class AdminSpanishLabelsTests(SimpleTestCase):
    def test_groups_and_token_models_are_hidden_from_admin(self):
        for model in (Group, BlacklistedToken, OutstandingToken):
            with self.subTest(model=model.__name__):
                self.assertFalse(admin.site.is_registered(model))

    def test_client_accounts_and_role_assignments_are_manageable_in_admin(self):
        self.assertTrue(admin.site.is_registered(CustomUser))
        self.assertIn(
            RoleUser,
            [
                inline.model
                for inline in CustomUserAdmin(CustomUser, admin.site).inlines
            ],
        )

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


class UserAdminProvisioningTests(TestCase):
    def test_admin_creation_form_saves_required_email_and_hashed_password(self):
        form = CustomUserCreationForm(
            data={
                "username": "portal-user",
                "email": "portal-user@example.com",
                "password1": "ClimaTec-Client-2026!Secure",
                "password2": "ClimaTec-Client-2026!Secure",
            }
        )
        self.assertTrue(form.is_valid(), form.errors)

        user = form.save()

        self.assertEqual(user.email, "portal-user@example.com")
        self.assertTrue(user.check_password("ClimaTec-Client-2026!Secure"))


class HasResourceAccessTests(SimpleTestCase):
    def test_permission_queries_existing_resource_role_relations(self):
        user = get_user_model()(pk=1)
        request = RequestFactory().get("/api/v1/auth/me/")
        request.user = user
        expected_filters = {
            "resource__method": "GET",
            "role__role_users__user": user,
        }
        queryset = SimpleNamespace(
            distinct=lambda: ["/api/v1/auth/me/"]
        )

        with patch.object(
            ResourceRole.objects,
            "filter",
            return_value=SimpleNamespace(
                values_list=lambda *args, **kwargs: queryset
            ),
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
            return_value=SimpleNamespace(
                values_list=lambda *args, **kwargs: SimpleNamespace(
                    distinct=lambda: []
                )
            ),
        ):
            allowed = HasResourceAccess().has_permission(request, view=None)

        self.assertFalse(allowed)

    def test_permission_matches_integer_detail_route_template(self):
        request = RequestFactory().get("/api/v1/clients/418/")
        request.user = get_user_model()(pk=1)

        with patch.object(
            ResourceRole.objects,
            "filter",
            return_value=SimpleNamespace(
                values_list=lambda *args, **kwargs: SimpleNamespace(
                    distinct=lambda: ["/api/v1/clients/<int:pk>/"]
                )
            ),
        ):
            allowed = HasResourceAccess().has_permission(request, view=None)

        self.assertTrue(allowed)

    def test_permission_does_not_match_non_integer_detail_route(self):
        request = RequestFactory().get("/api/v1/clients/not-an-id/")
        request.user = get_user_model()(pk=1)

        self.assertFalse(
            HasResourceAccess._path_matches(
                "/api/v1/clients/<int:pk>/", request.path
            )
        )

    def test_permission_filter_compiles_against_rbac_schema(self):
        user = get_user_model()(pk=1)
        queryset = ResourceRole.objects.filter(
            resource__method="GET",
            role__role_users__user=user,
        )

        sql, params = queryset.query.sql_with_params()

        self.assertIn("resource", sql)
        self.assertIn("role_users", sql)
        self.assertEqual(params, ("GET", 1))


class SeedRBACCommandTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="seed-admin",
            email="seed-admin@example.com",
            password="test-password",
        )

    def test_seed_grants_admin_crud_and_client_read_only_access(self):
        call_command("seed_rbac", username=self.user.username)

        admin_role = Role.objects.get(name="ADMIN")
        client_role = Role.objects.get(name="CLIENT")
        self.assertTrue(RoleUser.objects.filter(user=self.user, role=admin_role).exists())

        for method in ("GET", "POST"):
            self.assertTrue(
                ResourceRole.objects.filter(
                    resource__path="/api/v1/clients/",
                    resource__method=method,
                    role=admin_role,
                ).exists()
            )

        self.assertTrue(
            ResourceRole.objects.filter(
                resource__path="/api/v1/clients/<int:pk>/",
                resource__method="PATCH",
                role=admin_role,
            ).exists()
        )
        self.assertTrue(
            ResourceRole.objects.filter(
                resource__path="/api/v1/spare-parts/available/",
                resource__method="GET",
                role=admin_role,
            ).exists()
        )
        self.assertTrue(
            ResourceRole.objects.filter(
                resource__path="/api/v1/auth/me/",
                resource__method="GET",
                role=client_role,
            ).exists()
        )
        self.assertTrue(
            ResourceRole.objects.filter(
                resource__path="/api/v1/auth/permissions/",
                resource__method="GET",
                role=client_role,
            ).exists()
        )
        self.assertTrue(
            ResourceRole.objects.filter(
                resource__path="/api/v1/users/",
                resource__method="GET",
                role=admin_role,
            ).exists()
        )
        self.assertTrue(
            ResourceRole.objects.filter(
                resource__path="/api/v1/users/<int:pk>/permissions/",
                resource__method="GET",
                role=admin_role,
            ).exists()
        )
        client_read_only_collections = (
            "clients",
            "equipment",
            "service-orders",
            "diagnoses",
            "spare-part-consumptions",
            "quotes",
            "warranties",
            "payments",
        )
        for collection in client_read_only_collections:
            for path in (
                f"/api/v1/{collection}/",
                f"/api/v1/{collection}/<int:pk>/",
            ):
                with self.subTest(path=path):
                    self.assertTrue(
                        ResourceRole.objects.filter(
                            resource__path=path,
                            resource__method="GET",
                            role=client_role,
                        ).exists()
                    )

        self.assertFalse(
            ResourceRole.objects.filter(
                role=client_role,
                resource__path="/api/v1/clients/",
                resource__method="POST",
            ).exists()
        )
        self.assertFalse(
            ResourceRole.objects.filter(
                role=client_role,
                resource__method__in=("POST", "PUT", "PATCH", "DELETE"),
            ).exists()
        )
        self.assertFalse(
            ResourceRole.objects.filter(
                role=client_role,
                resource__path="/api/v1/spare-parts/",
            ).exists()
        )

    def test_seeded_admin_can_reach_collection_and_arbitrary_detail_routes(self):
        call_command("seed_rbac", username=self.user.username)
        token = AccessToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

        collection_response = self.client.get("/api/v1/clients/")
        detail_response = self.client.get("/api/v1/clients/418/")

        self.assertEqual(collection_response.status_code, status.HTTP_200_OK)
        self.assertEqual(detail_response.status_code, status.HTTP_404_NOT_FOUND)

    def test_client_role_can_read_profile_and_only_own_client_record(self):
        call_command("seed_rbac", username=self.user.username)
        client_user = get_user_model().objects.create_user(
            username="rbac-client",
            email="rbac-client@example.com",
            password="test-password",
        )
        client_role = Role.objects.get(name="CLIENT")
        RoleUser.objects.create(user=client_user, role=client_role)
        own_client = Client.objects.create(
            document_type="CC",
            document_number="CLIENT-OWN-001",
            name="Cliente propio",
            phone="3000000000",
            email="rbac-client@example.com",
            user=client_user,
        )
        Client.objects.create(
            document_type="CC",
            document_number="CLIENT-OTHER-001",
            name="Otro cliente",
            phone="3000000001",
            email="other@example.com",
        )
        token = AccessToken.for_user(client_user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

        profile_response = self.client.get("/api/v1/auth/me/")
        clients_response = self.client.get("/api/v1/clients/")
        spare_parts_response = self.client.get("/api/v1/spare-parts/")

        self.assertEqual(profile_response.status_code, status.HTTP_200_OK)
        self.assertEqual(clients_response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            [client["id"] for client in clients_response.json()],
            [own_client.pk],
        )
        self.assertEqual(spare_parts_response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(
            self.client.post("/api/v1/clients/", {}, format="json").status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_seed_is_idempotent(self):
        call_command("seed_rbac", username=self.user.username)
        first_resource_count = Resource.objects.count()
        first_assignment_count = ResourceRole.objects.count()

        call_command("seed_rbac", username=self.user.username)

        self.assertEqual(Resource.objects.count(), first_resource_count)
        self.assertEqual(ResourceRole.objects.count(), first_assignment_count)

    def test_seed_does_not_assign_admin_without_explicit_username(self):
        call_command("seed_rbac")

        admin_role = Role.objects.get(name="ADMIN")
        self.assertFalse(
            RoleUser.objects.filter(user=self.user, role=admin_role).exists()
        )

    def test_seed_rejects_unknown_username_before_creating_roles(self):
        from django.core.management import CommandError

        with self.assertRaises(CommandError):
            call_command("seed_rbac", username="missing-user")

        self.assertFalse(Role.objects.exists())


class AuthenticationFlowTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="auth-flow-user",
            email="auth-flow@example.com",
            password="test-password-123",
        )

    def login(self):
        response = self.client.post(
            "/api/v1/auth/login/",
            {"username": self.user.username, "password": "test-password-123"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        return response.data

    def test_login_and_profile_match_frontend_contract(self):
        call_command("seed_rbac", username=self.user.username)
        tokens = self.login()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")

        profile = self.client.get("/api/v1/auth/me/")
        profile_payload = profile.json()

        self.assertEqual(profile.status_code, status.HTTP_200_OK)
        self.assertEqual(profile_payload["username"], self.user.username)
        self.assertEqual(profile_payload["roles"], ["ADMIN"])
        self.assertIn("firstName", profile_payload)
        self.assertIn("lastName", profile_payload)
        self.assertIn("createdAt", profile_payload)

    def test_effective_permissions_are_returned_for_the_authenticated_user(self):
        call_command("seed_rbac", username=self.user.username)
        tokens = self.login()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")

        response = self.client.get("/api/v1/auth/permissions/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data["permissions"], list)
        self.assertTrue(
            any(
                permission["method"] == "GET"
                and permission["path"] == "/api/v1/clients/"
                and permission["roleName"] == "ADMIN"
                for permission in response.data["permissions"]
            )
        )
        self.assertTrue(
            any(
                permission["roleId"] == Role.objects.get(name="ADMIN").id
                for permission in response.data["permissions"]
            )
        )

    def test_refresh_rotates_and_blacklists_previous_refresh_token(self):
        tokens = self.login()

        refreshed = self.client.post(
            "/api/v1/auth/token/refresh/",
            {"refresh": tokens["refresh"]},
            format="json",
        )
        replayed = self.client.post(
            "/api/v1/auth/token/refresh/",
            {"refresh": tokens["refresh"]},
            format="json",
        )

        self.assertEqual(refreshed.status_code, status.HTTP_200_OK)
        self.assertIn("access", refreshed.data)
        self.assertNotEqual(refreshed.data["refresh"], tokens["refresh"])
        self.assertEqual(replayed.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_blacklists_the_refresh_token(self):
        tokens = self.login()

        logout = self.client.post(
            "/api/v1/auth/logout/",
            {"refresh": tokens["refresh"]},
            format="json",
        )
        refresh = self.client.post(
            "/api/v1/auth/token/refresh/",
            {"refresh": tokens["refresh"]},
            format="json",
        )

        self.assertEqual(logout.status_code, status.HTTP_205_RESET_CONTENT)
        self.assertEqual(refresh.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_rejects_missing_or_malformed_refresh_tokens(self):
        for payload in ({}, {"refresh": None}, {"refresh": []}, {"refresh": "invalid"}):
            with self.subTest(payload=payload):
                response = self.client.post(
                    "/api/v1/auth/logout/",
                    payload,
                    format="json",
                )
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
                self.assertEqual(
                    response.json(),
                    {"detail": "Token inválido o no proporcionado."},
                )


class UserAdministrationAPITests(APITestCase):
    def setUp(self):
        self.admin = get_user_model().objects.create_user(
            username="rbac-admin",
            email="rbac-admin@example.com",
            password="admin-test-password-123",
        )
        call_command("seed_rbac", username=self.admin.username)
        token = AccessToken.for_user(self.admin)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def test_admin_creates_user_with_hashed_password_and_safe_response(self):
        response = self.client.post(
            "/api/v1/users/",
            {
                "username": "new-client",
                "email": "new-client@example.com",
                "firstName": "New",
                "lastName": "Client",
                "isActive": True,
                "password": "secure-password-123",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertNotIn("password", response.data)
        self.assertNotIn("isStaff", response.data)
        created_user = get_user_model().objects.get(username="new-client")
        self.assertTrue(created_user.check_password("secure-password-123"))
        self.assertFalse(created_user.is_staff)
        self.assertFalse(created_user.is_superuser)

    def test_password_is_required_on_create_and_rejected_on_update(self):
        missing_password = self.client.post(
            "/api/v1/users/",
            {"username": "without-password", "email": "without@example.com"},
            format="json",
        )
        created_user = get_user_model().objects.create_user(
            username="editable-client",
            email="editable@example.com",
            password="client-password-123",
        )
        password_update = self.client.patch(
            f"/api/v1/users/{created_user.pk}/",
            {"password": "replacement-password-123"},
            format="json",
        )

        self.assertEqual(missing_password.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", missing_password.data)
        self.assertEqual(password_update.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(created_user.check_password("client-password-123"))

    def test_admin_cannot_delete_or_deactivate_the_current_account(self):
        delete_response = self.client.delete(f"/api/v1/users/{self.admin.pk}/")
        deactivate_response = self.client.patch(
            f"/api/v1/users/{self.admin.pk}/",
            {"isActive": False},
            format="json",
        )

        self.assertEqual(delete_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            deactivate_response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.admin.refresh_from_db()
        self.assertTrue(self.admin.is_active)

    def test_admin_reads_effective_permissions_for_any_user(self):
        target = get_user_model().objects.create_user(
            username="permission-target",
            email="permission-target@example.com",
            password="client-password-123",
        )
        target_client_role = Role.objects.get(name="CLIENT")
        RoleUser.objects.create(user=target, role=target_client_role)

        response = self.client.get(f"/api/v1/users/{target.pk}/permissions/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(
            any(
                permission["method"] == "GET"
                and permission["path"] == "/api/v1/clients/"
                and permission["roleName"] == "CLIENT"
                for permission in response.data["permissions"]
            )
        )
        self.assertFalse(
            any(
                permission["method"] == "POST"
                and permission["path"] == "/api/v1/clients/"
                for permission in response.data["permissions"]
            )
        )

    def test_client_cannot_access_user_administration(self):
        target = get_user_model().objects.create_user(
            username="read-only-client",
            email="read-only@example.com",
            password="client-password-123",
        )
        RoleUser.objects.create(user=target, role=Role.objects.get(name="CLIENT"))
        token = AccessToken.for_user(target)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

        response = self.client.get("/api/v1/users/")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


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
