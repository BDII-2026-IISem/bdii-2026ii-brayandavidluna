from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "users"

    def __str__(self):
        return self.username


class Role(models.Model):
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True, null=True)

    class Meta:
        db_table = "roles"

    def __str__(self):
        return self.name


class RoleUser(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="user_roles")
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name="role_users")

    class Meta:
        db_table = "role_users"
        unique_together = ("user", "role")


class Resource(models.Model):
    path = models.CharField(max_length=255, unique=True)
    method = models.CharField(max_length=10)
    description = models.TextField(blank=True, null=True)

    class Meta:
        db_table = "resources"
        unique_together = ("path", "method")

    def __str__(self):
        return f"[{self.method}] {self.path}"


class ResourceRole(models.Model):
    resource = models.ForeignKey(Resource, on_delete=models.CASCADE, related_name="resource_roles")
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name="role_resources")

    class Meta:
        db_table = "resource_roles"
        unique_together = ("resource", "role")