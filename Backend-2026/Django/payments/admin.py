from django.contrib import admin
from django import forms

from payments.models import Payment
from service_orders.models import ServiceOrder


class PaymentAdminForm(forms.ModelForm):
    class Meta:
        model = Payment
        fields = (
            "service_order",
            "method",
            "amount",
            "payment_date",
            "status",
        )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["service_order"].queryset = ServiceOrder.objects.select_related(
            "client", "technician"
        )
        self.fields["service_order"].label_from_instance = (
            lambda order: (
                f"{order.number} — {order.client.name} — "
                f"Técnico: {order.technician.name}"
            )
        )

    def clean(self):
        cleaned_data = super().clean()
        if not self.instance.pk and not cleaned_data.get("service_order"):
            self.add_error("service_order", "Seleccione la orden asociada al pago.")
        return cleaned_data


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    form = PaymentAdminForm
    fields = (
        "service_order",
        "method",
        "amount",
        "payment_date",
        "status",
        "technician_display",
    )
    readonly_fields = ("technician_display",)
    list_display = (
        "id",
        "get_client",
        "service_order",
        "technician_display",
        "method",
        "amount",
        "payment_date",
        "status",
    )
    list_filter = ("status", "method", "reference_type")
    search_fields = (
        "reference_id",
        "service_order__number",
        "service_order__client__name",
        "service_order__technician__name",
        "registered_by__username",
    )

    def get_fields(self, request, obj=None):
        fields = list(super().get_fields(request, obj))
        if obj is None:
            fields.remove("technician_display")
        return fields

    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            "service_order__client",
            "service_order__technician",
            "registered_by",
        )

    @admin.display(description="Cliente", ordering="service_order__client__name")
    def get_client(self, payment):
        if payment.service_order_id:
            return payment.service_order.client.name
        return "Sin orden asociada"

    @admin.display(
        description="Técnico responsable",
        ordering="service_order__technician__name",
    )
    def technician_display(self, payment):
        if payment.service_order_id:
            return payment.service_order.technician.name
        return "Sin orden asociada"

    def save_model(self, request, obj, form, change):
        if not change and obj.registered_by_id is None:
            obj.registered_by = request.user
        super().save_model(request, obj, form, change)
