# Generated by Django 3.2.25 on 2025-05-10 07:42

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='project',
            name='is_archived',
            field=models.BooleanField(default=False),
        ),
    ]
