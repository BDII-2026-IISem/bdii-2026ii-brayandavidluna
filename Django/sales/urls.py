from django.urls import path
from sales.views import (
    CancelSaleAPIView,
    RegisterSaleAPIView,
    SaleDetailView,
    SaleListView,
)

urlpatterns = [
    path("sales/", SaleListView.as_view(), name="sales-list"),
    path("sales/<int:pk>/", SaleDetailView.as_view(), name="sales-detail"),
    path("sales/register/", RegisterSaleAPIView.as_view(), name="sales-register"),
    path("sales/<int:pk>/cancel/", CancelSaleAPIView.as_view(), name="sales-cancel"),
]