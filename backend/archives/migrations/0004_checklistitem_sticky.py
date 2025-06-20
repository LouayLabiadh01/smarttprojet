# Generated by Django 3.2.25 on 2025-06-13 11:23

from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('archives', '0003_quicklink'),
    ]

    operations = [
        migrations.CreateModel(
            name='Sticky',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=255)),
                ('content', models.TextField(blank=True)),
                ('color', models.CharField(default='yellow', max_length=50)),
                ('type', models.CharField(choices=[('note', 'Note'), ('checklist', 'Checklist')], default='note', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
        ),
        migrations.CreateModel(
            name='ChecklistItem',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('text', models.CharField(max_length=255)),
                ('checked', models.BooleanField(default=False)),
                ('sticky', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='items', to='archives.sticky')),
            ],
        ),
    ]
