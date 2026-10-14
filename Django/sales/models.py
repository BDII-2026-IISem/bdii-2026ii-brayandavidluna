from django.db import models
from clients.models import Client
from products.models import Product


class Sale(models.Model):
    STATUS_CHOICES = [
        ("COMPLETED", "Completada"),
        ("CANCELLED", "Anulada"),
    ]

    client = models.ForeignKey(
        Client, on_delete=models.PROTECT, related_name="sales"
    )
    sale_date = models.DateTimeField(auto_now_add=True)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="COMPLETED"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "sales"
        ordering = ["-sale_date"]

    def __str__(self):
        return f"Venta #{self.id} - Cliente: {self.client.first_name} {self.client.last_name}"


class ProductSale(models.Model):
    sale = models.ForeignKey(
        Sale, on_delete=models.CASCADE, related_name="items"
    )
    product = models.ForeignKey(
        Product, on_delete=models.PROTECT, related_name="sale_items"
    )
    quantity = models.IntegerField()
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        db_table = "product_sales"

    def __str__(self):
        return f"{self.quantity}x {self.product.name} en Venta #{self.sale.id}"