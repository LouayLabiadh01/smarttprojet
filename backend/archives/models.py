from django.db import models
from users.models import User
import uuid

class Archive(models.Model):
    project_id = models.IntegerField(blank=True, null=True)
    name = models.CharField(max_length=255)
    sprint_duration = models.IntegerField(default=2)
    sprint_start = models.DateTimeField(auto_now_add=True)
    description = models.TextField(blank=True, null=True)
    image = models.CharField(max_length=1000, blank=True, null=True)
    color = models.CharField(max_length=7, default="#000000")
    is_ai_enabled = models.BooleanField(default=False)
    github_integration_id = models.IntegerField(blank=True, null=True)
    date_archivage = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "archives"

    def __str__(self):
        return self.name

class Quicklink(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    url = models.URLField()
    created_at = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return self.title



class Sticky(models.Model):
    NOTE = 'note'
    CHECKLIST = 'checklist'
    TYPE_CHOICES = [
        (NOTE, 'Note'),
        (CHECKLIST, 'Checklist'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    content = models.TextField(blank=True)
    color = models.CharField(max_length=50, default='yellow')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default=NOTE)
    created_at = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)

class ChecklistItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sticky = models.ForeignKey(Sticky, on_delete=models.CASCADE, related_name='items')
    text = models.CharField(max_length=255)
    checked = models.BooleanField(default=False)
