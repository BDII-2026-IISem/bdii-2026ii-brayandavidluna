from django.core.management.base import BaseCommand
from authentication.models import CustomUser, Resource, ResourceRole, Role, RoleUser


class Command(BaseCommand):
    help = "Poblar semilla inicial de datos para la matriz RBAC (ISS-24)"

    def handle(self, *args, **options):
        # 1. Crear Roles iniciales
        admin_role, _ = Role.objects.get_or_create(name="ADMIN")
        client_role, _ = Role.objects.get_or_create(name="CLIENT")

        # 2. Asignar rol ADMIN al primer usuario registrado
        user = CustomUser.objects.first()
        if user:
            RoleUser.objects.get_or_create(user=user, role=admin_role)

        # 3. Registrar Recurso /api/v1/auth/me/
        me_resource, _ = Resource.objects.get_or_create(
            path="/api/v1/auth/me/", method="GET", description="Perfil del usuario"
        )

        # 4. Asignar Recurso a los Roles
        ResourceRole.objects.get_or_create(resource=me_resource, role=admin_role)
        ResourceRole.objects.get_or_create(resource=me_resource, role=client_role)

        self.stdout.write(
            self.style.SUCCESS("Semilla RBAC ejecutada y poblada correctamente.")
        )