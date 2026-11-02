from django.contrib import admin
from django import forms

from clients.models import Client
from equipment.models import Equipment


class ClientAdminForm(forms.ModelForm):
    class Meta:
        model = Client
        fields = "__all__"

    def clean_user(self):
        user = self.cleaned_data.get("user")
        if user and not user.user_roles.filter(role__name="CLIENT").exists():
            raise forms.ValidationError("La cuenta debe tener asignado el rol CLIENT.")
        return user


class EquipmentInline(admin.TabularInline):
    model = Equipment
    extra = 0


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    form = ClientAdminForm
    list_display = (
        "id",
        "name",
        "document_number",
        "email",
        "user",
        "phone",
        "is_active",
    )
    search_fields = ("name", "document_number", "email", "user__username")
    list_filter = ("is_active", "document_type")
    inlines = [EquipmentInline]