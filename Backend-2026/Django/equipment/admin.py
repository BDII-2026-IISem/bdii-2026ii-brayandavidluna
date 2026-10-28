from django.contrib import admin

from equipment.models import Equipment


@admin.register(Equipment)
class EquipmentAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "client", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("name", "client__name")
