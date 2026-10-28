from django.contrib import admin

from technicians.models import Technician


@admin.register(Technician)
class TechnicianAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("name",)
