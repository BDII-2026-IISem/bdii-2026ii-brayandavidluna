from django.core.exceptions import ValidationError
from django.db import models, transaction

from clients.models import Client
from equipment.models import Equipment
from spare_parts.models import SparePart
from technicians.models import Technician


class ServiceOrder(models.Model):
    STATUS_CHOICES = [
        ("ABIERTA", "Abierta"),
        ("DIAGNOSTICO", "Diagnóstico"),
        ("COTIZADA", "Cotizada"),
        ("APROBADA", "Aprobada"),
        ("REPARACION", "Reparación"),
        ("CERRADA", "Cerrada"),
        ("CANCELADA", "Cancelada"),
    ]

    client = models.ForeignKey(
        Client,
        on_delete=models.PROTECT,
        related_name="service_orders",
        db_column="cliente_id",
        verbose_name="Cliente",
    )
    equipment = models.ForeignKey(
        Equipment,
        on_delete=models.PROTECT,
        related_name="service_orders",
        db_column="equipo_id",
        verbose_name="Equipo",
    )
    technician = models.ForeignKey(
        Technician,
        on_delete=models.PROTECT,
        related_name="service_orders",
        db_column="tecnico_id",
        verbose_name="Técnico",
    )
    number = models.CharField(max_length=50, unique=True, db_column="numero", verbose_name="Número")
    opened_at = models.DateTimeField(db_column="fecha_apertura", verbose_name="Fecha de apertura")
    closed_at = models.DateTimeField(
        blank=True, null=True, db_column="fecha_cierre", verbose_name="Fecha de cierre"
    )
    total = models.DecimalField(
        max_digits=12, decimal_places=2, default=0, verbose_name="Total"
    )
    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default="ABIERTA",
        db_column="estado",
        verbose_name="Estado",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de creación")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Última actualización")

    class Meta:
        db_table = "orden_servicio"
        verbose_name = "Orden de servicio"
        verbose_name_plural = "Órdenes de servicio"
        ordering = ["-opened_at"]

    def __str__(self):
        return self.number


class Diagnosis(models.Model):
    ACTIVE_STATUS_CHOICES = [
        ("ACTIVE", "Activo"),
        ("INACTIVE", "Inactivo"),
    ]

    service_order = models.ForeignKey(
        ServiceOrder,
        on_delete=models.PROTECT,
        related_name="diagnoses",
        db_column="orden_servicio_id",
        verbose_name="Orden de servicio",
    )
    name = models.CharField(max_length=150, db_column="nombre", verbose_name="Nombre")
    description = models.TextField(db_column="descripcion", verbose_name="Descripción")
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
        db_table = "diagnostico"
        verbose_name = "Diagnóstico"
        verbose_name_plural = "Diagnósticos"
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


class SparePartConsumption(models.Model):
    ACTIVE_STATUS_CHOICES = [
        ("ACTIVE", "Activo"),
        ("INACTIVE", "Inactivo"),
    ]

    service_order = models.ForeignKey(
        ServiceOrder,
        on_delete=models.PROTECT,
        related_name="spare_part_consumptions",
        db_column="orden_servicio_id",
        verbose_name="Orden de servicio",
    )
    spare_part = models.ForeignKey(
        SparePart,
        on_delete=models.PROTECT,
        related_name="consumptions",
        db_column="repuesto_id",
        verbose_name="Repuesto",
    )
    quantity = models.IntegerField(default=1, db_column="cantidad", verbose_name="Cantidad")
    unit_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        db_column="precio_unitario",
        verbose_name="Precio unitario",
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
        db_table = "consumo_repuesto"
        verbose_name = "Consumo de repuesto"
        verbose_name_plural = "Consumos de repuestos"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.quantity} x {self.spare_part}"

    def clean(self):
        if self.quantity is not None and self.quantity <= 0:
            raise ValidationError({"quantity": "La cantidad debe ser mayor que cero."})

        if self.status != "ACTIVE" or not self.spare_part_id:
            return

        spare_part = SparePart.objects.filter(pk=self.spare_part_id).first()
        if spare_part is None:
            return
        if spare_part.status != "ACTIVE":
            raise ValidationError({"spare_part": "El repuesto está inactivo."})

        available = spare_part.stock
        if self.pk:
            previous = type(self).objects.filter(pk=self.pk).only(
                "spare_part_id", "quantity", "status"
            ).first()
            if (
                previous
                and previous.status == "ACTIVE"
                and previous.spare_part_id == self.spare_part_id
            ):
                available += previous.quantity
        if self.quantity is not None and self.quantity > available:
            raise ValidationError(
                {"quantity": f"Existencias insuficientes. Disponibles: {available}."}
            )

    def save(self, *args, **kwargs):
        using = kwargs.get("using") or self._state.db or "default"
        if self.quantity is None or self.quantity <= 0:
            raise ValidationError({"quantity": "La cantidad debe ser mayor que cero."})
        if not self.spare_part_id:
            raise ValidationError({"spare_part": "Debe seleccionar un repuesto."})

        with transaction.atomic(using=using):
            previous = None
            if self.pk:
                previous = (
                    type(self)
                    .objects.using(using)
                    .select_for_update()
                    .filter(pk=self.pk)
                    .first()
                )
                if previous is None:
                    raise ValidationError("No se encontró el consumo de repuesto que se actualiza.")

            part_ids = {self.spare_part_id}
            if previous:
                part_ids.add(previous.spare_part_id)
            locked_parts = {
                part.pk: part
                for part in SparePart.objects.using(using)
                .select_for_update()
                .filter(pk__in=part_ids)
                .order_by("pk")
            }
            new_part = locked_parts.get(self.spare_part_id)
            if new_part is None:
                raise ValidationError({"spare_part": "El repuesto seleccionado no existe."})
            if self.status == "ACTIVE" and new_part.status != "ACTIVE":
                raise ValidationError({"spare_part": "El repuesto está inactivo."})

            stock_changes = {part_id: 0 for part_id in part_ids}
            if previous and previous.status == "ACTIVE":
                stock_changes[previous.spare_part_id] += previous.quantity
            if self.status == "ACTIVE":
                stock_changes[self.spare_part_id] -= self.quantity

            for part_id, change in stock_changes.items():
                part = locked_parts[part_id]
                if part.stock + change < 0:
                    previously_reserved = (
                        previous.quantity
                        if previous
                        and previous.status == "ACTIVE"
                        and previous.spare_part_id == part_id
                        else 0
                    )
                    raise ValidationError(
                        {
                            "quantity": f"Existencias insuficientes. Disponibles: "
                            f"{part.stock + previously_reserved}."
                        }
                    )

            for part_id, change in stock_changes.items():
                if change:
                    part = locked_parts[part_id]
                    part.stock += change
                    part.save(
                        using=using,
                        update_fields=["stock", "updated_at"],
                    )

            return super().save(*args, **kwargs)

    def delete(self, using=None, keep_parents=False):
        using = using or self._state.db or "default"
        with transaction.atomic(using=using):
            previous = (
                type(self)
                .objects.using(using)
                .select_for_update()
                .get(pk=self.pk)
            )
            if previous.status == "ACTIVE":
                spare_part = (
                    SparePart.objects.using(using)
                    .select_for_update()
                    .get(pk=previous.spare_part_id)
                )
                spare_part.stock += previous.quantity
                spare_part.save(using=using, update_fields=["stock", "updated_at"])
            return super().delete(using=using, keep_parents=keep_parents)


class Quote(models.Model):
    STATUS_CHOICES = [
        ("PENDIENTE", "Pendiente"),
        ("APROBADA", "Aprobada"),
        ("RECHAZADA", "Rechazada"),
    ]
    ACTIVE_STATUS_CHOICES = [
        ("ACTIVE", "Activo"),
        ("INACTIVE", "Inactivo"),
    ]

    service_order = models.ForeignKey(
        ServiceOrder,
        on_delete=models.PROTECT,
        related_name="quotes",
        db_column="orden_servicio_id",
        verbose_name="Orden de servicio",
    )
    name = models.CharField(max_length=150, db_column="nombre", verbose_name="Nombre")
    description = models.TextField(
        blank=True, null=True, db_column="descripcion", verbose_name="Descripción"
    )
    total_amount = models.DecimalField(
        max_digits=12, decimal_places=2, db_column="monto_total", verbose_name="Monto total"
    )
    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default="PENDIENTE",
        db_column="estado",
        verbose_name="Estado de cotización",
    )
    active_status = models.CharField(
        max_length=20,
        choices=ACTIVE_STATUS_CHOICES,
        default="ACTIVE",
        db_column="is_active",
        verbose_name="Vigencia",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de creación")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Última actualización")

    class Meta:
        db_table = "cotizacion"
        verbose_name = "Cotización"
        verbose_name_plural = "Cotizaciones"
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


class Warranty(models.Model):
    ACTIVE_STATUS_CHOICES = [
        ("ACTIVE", "Activo"),
        ("INACTIVE", "Inactivo"),
    ]

    service_order = models.OneToOneField(
        ServiceOrder,
        on_delete=models.PROTECT,
        related_name="warranty",
        db_column="orden_servicio_id",
        verbose_name="Orden de servicio",
    )
    name = models.CharField(max_length=150, db_column="nombre", verbose_name="Nombre")
    description = models.TextField(
        blank=True, null=True, db_column="descripcion", verbose_name="Descripción"
    )
    start_date = models.DateField(db_column="fecha_inicio", verbose_name="Fecha de inicio")
    end_date = models.DateField(db_column="fecha_fin", verbose_name="Fecha de finalización")
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
        db_table = "garantia"
        verbose_name = "Garantía"
        verbose_name_plural = "Garantías"

    def __str__(self):
        return self.name
