from django.db import models


class Technician(models.Model):
    ACTIVE_STATUS_CHOICES = [
        ("ACTIVE", "Activo"),
        ("INACTIVE", "Inactivo"),
    ]

    name = models.CharField(max_length=150, db_column="nombre", verbose_name="Nombre")
    description = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        db_column="descripcion",
        verbose_name="Descripción",
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
        db_table = "tecnico"
        verbose_name = "Técnico"
        verbose_name_plural = "Técnicos"
        ordering = ["name"]

    def __str__(self):
        return self.name
