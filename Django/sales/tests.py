from django.test import SimpleTestCase
from sales.serializers import RegisterSaleSerializer


class RegisterSaleSerializerTests(SimpleTestCase):
    def test_rejects_empty_items(self):
        serializer = RegisterSaleSerializer(
            data={"client_id": 1, "items": []},
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("items", serializer.errors)

    def test_rejects_non_positive_quantity(self):
        serializer = RegisterSaleSerializer(
            data={
                "client_id": 1,
                "items": [{"product_id": 1, "quantity": 0}],
            },
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("items", serializer.errors)

    def test_accepts_positive_sale_lines(self):
        serializer = RegisterSaleSerializer(
            data={
                "client_id": 1,
                "items": [{"product_id": 2, "quantity": 3}],
            },
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)
