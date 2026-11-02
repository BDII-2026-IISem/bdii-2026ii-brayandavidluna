from django.conf import settings
from django.db import models


class Client(models.Model):
    DOCUMENT_TYPE_CHOICES = [
        ("CC", "Cédula de Ciudadanía"),
        ("CE", "Cédula de Extranjería"),
        ("NIT", "Número de Identificación Tributaria"),
        ("PP", "Pasaporte"),
    ]

    document_type = models.CharField(
        max_length=20,
        choices=DOCUMENT_TYPE_CHOICES,
        verbose_name="Tipo de documento",
        db_column="tipo_documento",
    )
    document_number = models.CharField(
        max_length=30,
        unique=True,
        verbose_name="Número de documento",
        db_column="numero_documento",
    )
    name = models.CharField(
        max_length=150,
        verbose_name="Nombre",
        db_column="nombre",
    )
    phone = models.CharField(
        max_length=30, db_column="telefono", verbose_name="Teléfono"
    )
    email = models.EmailField(max_length=150, verbose_name="Correo electrónico")
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="client_profile",
        blank=True,
        null=True,
        verbose_name="Cuenta de acceso",
    )
    address = models.CharField(
        max_length=255, blank=True, null=True, verbose_name="Dirección"
    )
    is_active = models.CharField(
        max_length=20,
        choices=[("ACTIVE", "Activo"), ("INACTIVE", "Inactivo")],
        default="ACTIVE",
        verbose_name="Estado",
    )
    created_at = models.DateTimeField(
        auto_now_add=True, verbose_name="Fecha de creación"
    )
    updated_at = models.DateTimeField(
        auto_now=True, verbose_name="Última actualización"
    )

    class Meta:
        db_table = "cliente"
        verbose_name = "Cliente"
        verbose_name_plural = "Clientes"

    def __str__(self):
        return f"{self.name} ({self.document_number})"