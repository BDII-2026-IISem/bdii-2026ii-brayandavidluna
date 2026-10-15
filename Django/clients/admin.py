from django.contrib import admin
from clients.models import Client


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ("id", "first_name", "last_name", "document_number", "email", "is_active")
    search_fields = ("first_name", "last_name", "document_number", "email")
    list_filter = ("is_active", "document_type")