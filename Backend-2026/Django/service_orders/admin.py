from django.contrib import admin
from django import forms

from payments.models import Payment
from service_orders.models import (
    Diagnosis,
    Quote,
    ServiceOrder,
    SparePartConsumption,
    Warranty,
)


class ServiceOrderAdminForm(forms.ModelForm):
    class Meta:
        model = ServiceOrder
        fields = "__all__"

    def clean(self):
        cleaned_data = super().clean()
        client = cleaned_data.get("client")
        equipment = cleaned_data.get("equipment")
        if client and equipment and equipment.client_id != client.pk:
            self.add_error(
                "equipment",
                "El equipo seleccionado no pertenece al cliente indicado.",
            )
        return cleaned_data


class DiagnosisInline(admin.TabularInline):
    model = Diagnosis
    extra = 0
    fields = (
        "client_display",
        "description",
        "status",
        "technician_display",
    )
    readonly_fields = ("client_display", "technician_display")

    @admin.display(description="Cliente")
    def client_display(self, diagnosis):
        if diagnosis.service_order_id:
            return diagnosis.service_order.client.name
        return "Se toma de la orden"

    @admin.display(description="Técnico responsable")
    def technician_display(self, diagnosis):
        if diagnosis.service_order_id:
            return diagnosis.service_order.technician.name
        return "Sin orden asociada"


class SparePartConsumptionInline(admin.TabularInline):
    model = SparePartConsumption
    extra = 0
    fields = ("spare_part", "quantity", "unit_price", "status", "technician_display")
    readonly_fields = ("technician_display",)

    @admin.display(description="Técnico responsable")
    def technician_display(self, consumption):
        if consumption.service_order_id:
            return consumption.service_order.technician.name
        return "Sin orden asociada"


class QuoteInline(admin.TabularInline):
    model = Quote
    extra = 0
    fields = (
        "client_display",
        "description",
        "total_amount",
        "status",
        "active_status",
        "technician_display",
    )
    readonly_fields = ("client_display", "technician_display")

    @admin.display(description="Cliente")
    def client_display(self, quote):
        if quote.service_order_id:
            return quote.service_order.client.name
        return "Se toma de la orden"

    @admin.display(description="Técnico responsable")
    def technician_display(self, quote):
        if quote.service_order_id:
            return quote.service_order.technician.name
        return "Sin orden asociada"


class WarrantyInline(admin.StackedInline):
    model = Warranty
    extra = 0
    max_num = 1
    fields = (
        "client_display",
        "description",
        "start_date",
        "end_date",
        "status",
        "technician_display",
    )
    readonly_fields = ("client_display", "technician_display")

    @admin.display(description="Cliente")
    def client_display(self, warranty):
        if warranty.service_order_id:
            return warranty.service_order.client.name
        return "Se toma de la orden"

    @admin.display(description="Técnico")
    def technician_display(self, warranty):
        if warranty.service_order_id:
            return warranty.service_order.technician.name
        return "Sin orden asociada"

    def save_new(self, form, commit=True):
        instance = super().save_new(form, commit=False)
        instance.name = f"Garantía - {instance.service_order.client.name}"
        if commit:
            instance.save()
            form.save_m2m()
        return instance


class PaymentInline(admin.TabularInline):
    model = Payment
    extra = 0
    fields = (
        "method",
        "amount",
        "payment_date",
        "status",
        "technician_display",
    )
    readonly_fields = ("technician_display",)

    @admin.display(description="Técnico responsable")
    def technician_display(self, payment):
        if payment.service_order_id:
            return payment.service_order.technician.name
        return "Se toma de la orden"


@admin.register(ServiceOrder)
class ServiceOrderAdmin(admin.ModelAdmin):
    form = ServiceOrderAdminForm
    list_display = ("id", "number", "client", "equipment", "technician", "status", "opened_at")
    list_filter = ("status",)
    search_fields = ("number", "client__name")
    inlines = [
        DiagnosisInline,
        SparePartConsumptionInline,
        QuoteInline,
        WarrantyInline,
        PaymentInline,
    ]

    def save_formset(self, request, form, formset, change):
        managed_models = {Payment, Warranty, Quote, Diagnosis}
        if formset.model not in managed_models:
            return super().save_formset(request, form, formset, change)

        instances = formset.save(commit=False)
        for deleted_object in formset.deleted_objects:
            deleted_object.delete()
        for instance in instances:
            if instance._state.adding:
                if formset.model is Payment:
                    instance.registered_by = request.user
            if formset.model is Warranty:
                instance.name = f"Garantía - {instance.service_order.client.name}"
            elif formset.model is Quote:
                instance.name = f"Cotización - {instance.service_order.client.name}"
            elif formset.model is Diagnosis:
                instance.name = f"Diagnóstico - {instance.service_order.client.name}"
            instance.save()
        formset.save_m2m()


@admin.register(Diagnosis)
class DiagnosisAdmin(admin.ModelAdmin):
    fields = (
        "service_order",
        "get_client",
        "description",
        "status",
        "get_technician",
    )
    readonly_fields = ("get_client", "get_technician")
    list_display = (
        "id",
        "get_client",
        "service_order",
        "get_technician",
        "description",
        "status",
        "created_at",
    )
    list_filter = ("status",)
    search_fields = (
        "description",
        "service_order__client__name",
        "service_order__number",
        "service_order__technician__name",
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            "service_order__client",
            "service_order__technician",
        )

    @admin.display(description="Cliente", ordering="service_order__client__name")
    def get_client(self, record):
        if record.service_order_id:
            return record.service_order.client.name
        return "Seleccione una orden de servicio"

    @admin.display(description="Técnico", ordering="service_order__technician__name")
    def get_technician(self, record):
        if record.service_order_id:
            return record.service_order.technician.name
        return "Seleccione una orden de servicio"

    def save_model(self, request, obj, form, change):
        if not change:
            obj.name = f"Diagnóstico - {obj.service_order.client.name}"
        super().save_model(request, obj, form, change)


@admin.register(SparePartConsumption)
class SparePartConsumptionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "service_order",
        "get_technician",
        "spare_part",
        "quantity",
        "unit_price",
        "status",
    )
    list_filter = ("status",)
    search_fields = (
        "service_order__number",
        "service_order__technician__name",
        "spare_part__name",
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            "service_order__technician", "spare_part"
        )

    @admin.display(description="Técnico responsable", ordering="service_order__technician__name")
    def get_technician(self, record):
        return record.service_order.technician.name


@admin.register(Quote)
class QuoteAdmin(admin.ModelAdmin):
    fields = (
        "service_order",
        "get_client",
        "description",
        "total_amount",
        "status",
        "active_status",
        "get_technician",
    )
    readonly_fields = ("get_client", "get_technician")
    list_display = (
        "id",
        "get_client",
        "service_order",
        "get_technician",
        "description",
        "total_amount",
        "status",
        "active_status",
    )
    list_filter = ("status", "active_status")
    search_fields = (
        "description",
        "service_order__client__name",
        "service_order__number",
        "service_order__technician__name",
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            "service_order__client",
            "service_order__technician",
        )

    @admin.display(description="Cliente", ordering="service_order__client__name")
    def get_client(self, record):
        if record.service_order_id:
            return record.service_order.client.name
        return "Seleccione una orden de servicio"

    @admin.display(description="Técnico", ordering="service_order__technician__name")
    def get_technician(self, record):
        if record.service_order_id:
            return record.service_order.technician.name
        return "Seleccione una orden de servicio"

    def save_model(self, request, obj, form, change):
        if not change:
            obj.name = f"Cotización - {obj.service_order.client.name}"
        super().save_model(request, obj, form, change)


@admin.register(Warranty)
class WarrantyAdmin(admin.ModelAdmin):
    fields = (
        "service_order",
        "get_client",
        "description",
        "start_date",
        "end_date",
        "status",
        "get_technician",
    )
    readonly_fields = ("get_client", "get_technician")
    list_display = (
        "id",
        "get_client",
        "service_order",
        "get_technician",
        "start_date",
        "end_date",
        "status",
    )
    list_filter = ("status",)
    search_fields = (
        "service_order__client__name",
        "service_order__number",
        "service_order__technician__name",
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            "service_order__client",
            "service_order__technician",
        )

    @admin.display(description="Cliente", ordering="service_order__client__name")
    def get_client(self, record):
        if record.service_order_id:
            return record.service_order.client.name
        return "Seleccione una orden de servicio"

    @admin.display(description="Técnico", ordering="service_order__technician__name")
    def get_technician(self, record):
        if record.service_order_id:
            return record.service_order.technician.name
        return "Seleccione una orden de servicio"

    def save_model(self, request, obj, form, change):
        if not change:
            obj.name = f"Garantía - {obj.service_order.client.name}"
        super().save_model(request, obj, form, change)
