from django.db import models

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
