from django.db import models


class SparePart(models.Model):
    ACTIVE_STATUS_CHOICES = [
        ("ACTIVE", "Activo"),
        ("INACTIVE", "Inactivo"),
    ]

    name = models.CharField(max_length=150, db_column="nombre", verbose_name="Nombre")
    description = models.TextField(
        blank=True, null=True, db_column="descripcion", verbose_name="Descripción"
    )
    price = models.DecimalField(
        max_digits=10, decimal_places=2, db_column="precio", verbose_name="Precio"
    )
    stock = models.PositiveIntegerField(default=0, verbose_name="Existencias")
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
        db_table = "repuesto"
        verbose_name = "Repuesto"
        verbose_name_plural = "Repuestos"
        ordering = ["name"]

    def __str__(self):
        return self.name
