# Generated by Django 3.2.25 on 2025-05-05 21:35

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('notifications', '0003_auto_20250503_1615'),
    ]

    operations = [
        migrations.RenameField(
            model_name='notification',
            old_name='read_at',
            new_name='readAt',
        ),
    ]
