from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("spare_parts", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="sparepart",
            name="stock",
            field=models.PositiveIntegerField(default=0, verbose_name="Existencias"),
        ),
    ]
