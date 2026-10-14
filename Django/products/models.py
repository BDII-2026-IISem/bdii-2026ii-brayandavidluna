from django.db import models


class ProductType(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "product_types"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Product(models.Model):
    product_type = models.ForeignKey(
        ProductType, on_delete=models.CASCADE, related_name="products"
    )
    name = models.CharField(max_length=150)
    code = models.CharField(max_length=50, unique=True)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    stock = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "products"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} ({self.code})"