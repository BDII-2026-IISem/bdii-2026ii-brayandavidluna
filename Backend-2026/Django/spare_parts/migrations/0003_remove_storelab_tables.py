from django.db import migrations


def remove_storelab_tables(apps, schema_editor):
    connection = schema_editor.connection
    existing_tables = {
        table_name.lower(): table_name
        for table_name in connection.introspection.table_names()
    }
    obsolete_tables = (
        "product_sales",
        "sales_sale",
        "sales",
        "products",
        "product_types",
    )

    for table_name in obsolete_tables:
        actual_table_name = existing_tables.get(table_name.lower())
        if actual_table_name:
            quoted_table = connection.ops.quote_name(actual_table_name)
            schema_editor.execute(f"DROP TABLE {quoted_table}")


class Migration(migrations.Migration):

    atomic = False

    dependencies = [
        ("spare_parts", "0002_sparepart_stock"),
    ]

    operations = [
        migrations.RunPython(remove_storelab_tables),
    ]
