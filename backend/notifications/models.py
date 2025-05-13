# notifications/models.py

from django.db import models
from django.utils import timezone

from users.models import User
from taches.models import Task
from projects.models import Project

class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications',null=True )
    taskId = models.ForeignKey(Task, on_delete=models.SET_NULL, null=True, blank=True, related_name='notifications')
    projectId = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255,null=True, blank=True)
    message = models.TextField(blank=True)
    date = models.DateTimeField(default=timezone.now)
    readAt = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f'Notification for {self.user} - {self.title}'
