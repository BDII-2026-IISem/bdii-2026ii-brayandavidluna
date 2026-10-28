from django.db import models

from clients.models import Client


class Equipment(models.Model):
    ACTIVE_STATUS_CHOICES = [
        ("ACTIVE", "Activo"),
        ("INACTIVE", "Inactivo"),
    ]

    client = models.ForeignKey(
        Client,
        on_delete=models.PROTECT,
        related_name="equipment",
        db_column="cliente_id",
        verbose_name="Cliente",
    )
    name = models.CharField(max_length=100, db_column="nombre", verbose_name="Nombre")
    description = models.TextField(
        blank=True, null=True, db_column="descripcion", verbose_name="Descripción"
    )
    status = models.CharField(
        max_length=20,
        choices=ACTIVE_STATUS_CHOICES,
        default="ACTIVE",
        db_column="is_active",
        verbose_name="Estado",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de creación")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Última actualización")

    class Meta:
        db_table = "equipo"
        verbose_name = "Equipo"
        verbose_name_plural = "Equipos"
        ordering = ["name"]

    def __str__(self):
        return self.name
