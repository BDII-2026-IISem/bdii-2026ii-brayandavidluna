from django.contrib import admin
from clients.models import Client
from equipment.models import Equipment


class EquipmentInline(admin.TabularInline):
    model = Equipment
    extra = 0


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "document_number", "email", "phone", "is_active")
    search_fields = ("name", "document_number", "email")
    list_filter = ("is_active", "document_type")
    inlines = [EquipmentInline]