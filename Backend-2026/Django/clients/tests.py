from django.test import SimpleTestCase

from clients.models import Client


class ClientSchemaTests(SimpleTestCase):
    def test_client_fields_map_to_the_climatec_schema(self):
        expected_columns = {
            "document_type": "tipo_documento",
            "document_number": "numero_documento",
            "name": "nombre",
            "phone": "telefono",
            "email": "email",
            "address": "address",
            "is_active": "is_active",
        }

        for field_name, column_name in expected_columns.items():
            with self.subTest(field=field_name):
                self.assertEqual(Client._meta.get_field(field_name).column, column_name)
