from django.contrib import admin

from spare_parts.models import SparePart


@admin.register(SparePart)
class SparePartAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "price", "stock", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("name", "description")
