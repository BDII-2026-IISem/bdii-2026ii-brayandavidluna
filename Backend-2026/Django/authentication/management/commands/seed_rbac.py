from django.core.management.base import BaseCommand, CommandError
from authentication.models import CustomUser, Resource, ResourceRole, Role, RoleUser


BUSINESS_COLLECTIONS = (
    "clients",
    "equipment",
    "technicians",
    "service-orders",
    "diagnoses",
    "spare-part-consumptions",
    "quotes",
    "warranties",
    "spare-parts",
    "payments",
)

RBAC_COLLECTIONS = ("roles", "resources", "role-users", "resource-roles")
COLLECTION_METHODS = ("GET", "POST")
DETAIL_METHODS = ("GET", "PUT", "PATCH", "DELETE")
ADMIN_READ_ONLY_ENDPOINTS = (
    ("/api/v1/spare-parts/available/", "GET", "Consultar repuestos disponibles"),
)
CLIENT_READ_ONLY_COLLECTIONS = (
    "clients",
    "equipment",
    "service-orders",
    "diagnoses",
    "spare-part-consumptions",
    "quotes",
    "warranties",
    "payments",
)


class Command(BaseCommand):
    help = "Poblar semilla inicial de datos para la matriz RBAC (ISS-24)"

    def add_arguments(self, parser):
        parser.add_argument(
            "--username",
            help="Usuario explícito al que se le asignará el rol ADMIN.",
        )

    def handle(self, *args, **options):
        username = options.get("username")
        user = None
        if username:
            try:
                user = CustomUser.objects.get(username=username)
            except CustomUser.DoesNotExist as error:
                raise CommandError(
                    f"No existe un usuario con username '{username}'."
                ) from error

        admin_role, _ = Role.objects.get_or_create(name="ADMIN")
        client_role, _ = Role.objects.get_or_create(name="CLIENT")

        if user:
            RoleUser.objects.get_or_create(user=user, role=admin_role)

        for collection in BUSINESS_COLLECTIONS + RBAC_COLLECTIONS:
            self._assign_collection_permissions(collection, admin_role)

        for path, method, description in ADMIN_READ_ONLY_ENDPOINTS:
            resource = self._ensure_resource(path, method, description)
            ResourceRole.objects.get_or_create(resource=resource, role=admin_role)

        for collection in CLIENT_READ_ONLY_COLLECTIONS:
            self._assign_collection_read_permissions(collection, client_role)

        me_resource = self._ensure_resource(
            "/api/v1/auth/me/", "GET", "Consultar el perfil del usuario"
        )
        ResourceRole.objects.get_or_create(resource=me_resource, role=admin_role)
        ResourceRole.objects.get_or_create(resource=me_resource, role=client_role)

        self.stdout.write(self.style.SUCCESS("Semilla RBAC ejecutada correctamente."))
        if user:
            self.stdout.write(f"Rol ADMIN asignado explícitamente a '{username}'.")
        else:
            self.stdout.write(
                self.style.WARNING(
                    "No se asignó ADMIN a ningún usuario. "
                    "Use --username para elegirlo explícitamente."
                )
            )

    def _assign_collection_permissions(self, collection, role):
        collection_path = f"/api/v1/{collection}/"
        detail_path = f"/api/v1/{collection}/<int:pk>/"

        for method in COLLECTION_METHODS:
            resource = self._ensure_resource(
                collection_path, method, f"{method} {collection}"
            )
            ResourceRole.objects.get_or_create(resource=resource, role=role)

        for method in DETAIL_METHODS:
            resource = self._ensure_resource(
                detail_path, method, f"{method} {collection} por identificador"
            )
            ResourceRole.objects.get_or_create(resource=resource, role=role)

    def _assign_collection_read_permissions(self, collection, role):
        collection_path = f"/api/v1/{collection}/"
        detail_path = f"/api/v1/{collection}/<int:pk>/"

        for path, description in (
            (collection_path, f"GET {collection} propios"),
            (detail_path, f"GET {collection} propio por identificador"),
        ):
            resource = self._ensure_resource(path, "GET", description)
            ResourceRole.objects.get_or_create(resource=resource, role=role)

    @staticmethod
    def _ensure_resource(path, method, description):
        resource, _ = Resource.objects.get_or_create(
            path=path,
            method=method,
            defaults={"description": description},
        )
        return resource