from django.conf import settings
from django.db import models

from service_orders.models import ServiceOrder


class Payment(models.Model):
    STATUS_CHOICES = [
        ("COMPLETADO", "Completado"),
        ("PENDIENTE", "Pendiente"),
        ("ANULADO", "Anulado"),
    ]

    reference_type = models.CharField(
        max_length=50, db_column="referencia_tipo", verbose_name="Tipo de referencia"
    )
    reference_id = models.IntegerField(
        db_column="referencia_id", verbose_name="Identificador de referencia"
    )
    service_order = models.ForeignKey(
        ServiceOrder,
        on_delete=models.PROTECT,
        related_name="payments",
        db_column="orden_servicio_id",
        blank=True,
        null=True,
        verbose_name="Orden de servicio",
    )
    registered_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="registered_payments",
        db_column="registrado_por_id",
        blank=True,
        null=True,
        verbose_name="Registrado por",
    )
    method = models.CharField(max_length=50, db_column="metodo", verbose_name="Método")
    amount = models.DecimalField(
        max_digits=12, decimal_places=2, db_column="monto", verbose_name="Monto"
    )
    payment_date = models.DateTimeField(db_column="fecha", verbose_name="Fecha de pago")
    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default="COMPLETADO",
        db_column="estado",
        verbose_name="Estado",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de creación")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Última actualización")

    class Meta:
        db_table = "pago"
        verbose_name = "Pago"
        verbose_name_plural = "Pagos"
        ordering = ["-payment_date"]

    def __str__(self):
        return f"Pago #{self.pk} - {self.amount}"

    def save(self, *args, **kwargs):
        if self.service_order_id:
            self.reference_type = "ORDEN_SERVICIO"
            self.reference_id = self.service_order_id
        super().save(*args, **kwargs)
