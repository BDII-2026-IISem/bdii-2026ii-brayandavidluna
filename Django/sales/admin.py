from django.contrib import admin
from sales.models import ProductSale, Sale


class ProductSaleInline(admin.TabularInline):
    model = ProductSale
    extra = 0


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = ("id", "client", "total_amount", "status", "sale_date")
    list_filter = ("status", "sale_date")
    inlines = [ProductSaleInline]