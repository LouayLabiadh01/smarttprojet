# Generated by Django 3.2.25 on 2025-05-09 22:27

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('archives', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='archive',
            name='project_id',
            field=models.IntegerField(blank=True, null=True),
        ),
    ]
