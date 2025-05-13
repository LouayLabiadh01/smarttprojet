from django.db import models
from django.conf import settings
from users.models import User
from projects.models import Project, Sprint  # Sprint is imported from projets

class Task(models.Model):
    STATUS_CHOICES = [
        ('backlog', 'Backlog'),
        ('todo', 'To Do'),
        ('inprogress', 'In Progress'),
        ('inreview', 'In Review'),
        ('done', 'Done'),
    ]
    POINT_CHOICES = [(str(i), str(i)) for i in range(6)]
    PRIORITY_CHOICES = [
        ('none', 'None'),
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    TYPE_CHOICES = [
        ('task', 'Task'),
        ('bug', 'Bug'),
        ('feature', 'Feature'),
        ('improvement', 'Improvement'),
        ('research', 'Research'),
        ('testing', 'Testing'),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField(default='', blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='todo')
    points = models.CharField(max_length=1, choices=POINT_CHOICES, default='0')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='low')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='task')
    backlogOrder = models.IntegerField(default=0)
    last_edited_at = models.DateTimeField(null=True, blank=True)
    inserted_date = models.DateTimeField(auto_now_add=True)
    assignee = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tasks')
    projectId = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')
    sprintId = models.ForeignKey(Sprint, on_delete=models.SET_NULL, null=True, blank=True, related_name='tasks',default=-1)
    branchName = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
        return self.title

class TaskToView(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='views')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='task_views')
    viewed_at = models.DateTimeField()

    class Meta:
        unique_together = ('task', 'user')

class TaskHistory(models.Model):
    PROPERTY_KEY_CHOICES = [
        ('status', 'Status'),
        ('priority', 'Priority'),
        ('assignee', 'Assignee'),
        ('sprintId', 'Sprint ID'),
        ('type', 'Type'),
        ('points', 'Points'),
    ]
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='history')
    property_key = models.CharField(max_length=20, choices=PROPERTY_KEY_CHOICES, null=True, blank=True)
    property_value = models.CharField(max_length=255, null=True, blank=True)
    old_property_value = models.CharField(max_length=255, null=True, blank=True)
    comment = models.CharField(max_length=255, null=True, blank=True)
    user = models.ForeignKey(User,to_field="user_id", on_delete=models.CASCADE, related_name='task_history_entries')
    inserted_date = models.DateTimeField(auto_now_add=True)

class Comment(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='task_comments')
    comment = models.TextField()
    inserted_date = models.DateTimeField()
