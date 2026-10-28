from django.db import migrations, models


def combine_names_and_convert_status(apps, schema_editor):
    Client = apps.get_model("clients", "Client")
    for client in Client.objects.all().iterator():
        client.name = f"{client.first_name} {client.last_name}".strip()
        client.is_active = "ACTIVE" if client.is_active_legacy else "INACTIVE"
        client.save(update_fields=["name", "is_active"])


def restore_split_names_and_status(apps, schema_editor):
    Client = apps.get_model("clients", "Client")
    for client in Client.objects.all().iterator():
        name_parts = client.name.split(maxsplit=1)
        client.first_name = name_parts[0]
        client.last_name = name_parts[1] if len(name_parts) > 1 else ""
        client.is_active_legacy = client.is_active == "ACTIVE"
        client.save(
            update_fields=["first_name", "last_name", "is_active_legacy"]
        )


class Migration(migrations.Migration):
    dependencies = [
        ("clients", "0003_alter_client_address_alter_client_created_at_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="client",
            name="name",
            field=models.CharField(
                blank=True,
                db_column="nombre",
                max_length=150,
                null=True,
                verbose_name="Nombre",
            ),
        ),
        migrations.RenameField(
            model_name="client",
            old_name="is_active",
            new_name="is_active_legacy",
        ),
        migrations.AddField(
            model_name="client",
            name="is_active",
            field=models.CharField(
                blank=True,
                choices=[("ACTIVE", "Activo"), ("INACTIVE", "Inactivo")],
                default="ACTIVE",
                max_length=20,
                null=True,
                verbose_name="Estado",
            ),
        ),
        migrations.RunPython(
            combine_names_and_convert_status,
            restore_split_names_and_status,
        ),
        migrations.AlterField(
            model_name="client",
            name="name",
            field=models.CharField(
                db_column="nombre",
                max_length=150,
                verbose_name="Nombre",
            ),
        ),
        migrations.AlterField(
            model_name="client",
            name="is_active",
            field=models.CharField(
                choices=[("ACTIVE", "Activo"), ("INACTIVE", "Inactivo")],
                default="ACTIVE",
                max_length=20,
                verbose_name="Estado",
            ),
        ),
        migrations.AlterField(
            model_name="client",
            name="document_type",
            field=models.CharField(
                choices=[
                    ("CC", "Cédula de Ciudadanía"),
                    ("CE", "Cédula de Extranjería"),
                    ("NIT", "Número de Identificación Tributaria"),
                    ("PP", "Pasaporte"),
                ],
                db_column="tipo_documento",
                max_length=20,
                verbose_name="Tipo de documento",
            ),
        ),
        migrations.AlterField(
            model_name="client",
            name="document_number",
            field=models.CharField(
                db_column="numero_documento",
                max_length=30,
                unique=True,
                verbose_name="Número de documento",
            ),
        ),
        migrations.AlterField(
            model_name="client",
            name="phone",
            field=models.CharField(max_length=30, verbose_name="Teléfono"),
        ),
        migrations.AlterField(
            model_name="client",
            name="email",
            field=models.EmailField(
                max_length=150,
                verbose_name="Correo electrónico",
            ),
        ),
        migrations.RemoveField(
            model_name="client",
            name="first_name",
        ),
        migrations.RemoveField(
            model_name="client",
            name="last_name",
        ),
        migrations.RemoveField(
            model_name="client",
            name="is_active_legacy",
        ),
    ]
