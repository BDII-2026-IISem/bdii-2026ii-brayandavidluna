from django.urls import path
from rest_framework.routers import DefaultRouter
from products.views import (
    AvailableProductsListView,
    ProductTypeViewSet,
    ProductViewSet,
)

router = DefaultRouter()
router.register(r"product-types", ProductTypeViewSet, basename="product-type")
router.register(r"products", ProductViewSet, basename="product")

urlpatterns = router.urls + [
    path("products-available/", AvailableProductsListView.as_view(), name="products-available"),
]