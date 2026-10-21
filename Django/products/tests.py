from django.test import SimpleTestCase

from products.views import AvailableProductsListView


class AvailableProductsListViewTests(SimpleTestCase):
    def test_queryset_requires_active_products_with_stock(self):
        sql, params = AvailableProductsListView.queryset.query.sql_with_params()

        self.assertIn("is_active", sql)
        self.assertIn("stock", sql)
        self.assertEqual(params, (True, 0))
