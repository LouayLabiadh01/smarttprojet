# Generated by Django 3.2.25 on 2025-05-06 19:28

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='role',
            field=models.CharField(default='Membre', max_length=255),
        ),
    ]
