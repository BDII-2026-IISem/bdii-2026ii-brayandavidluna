from django.contrib import admin
from products.models import Product, ProductType


@admin.register(ProductType)
class ProductTypeAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "is_active", "created_at")
    search_fields = ("name",)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("id", "code", "name", "product_type", "price", "stock", "is_active")
    search_fields = ("code", "name")
    list_filter = ("is_active", "product_type")