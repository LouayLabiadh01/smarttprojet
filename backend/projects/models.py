from django.db import models
from users.models import User


class Project(models.Model):
    name = models.CharField(max_length=255)
    sprint_duration = models.IntegerField(default=2)
    sprint_start = models.DateTimeField(auto_now_add=True)
    description = models.TextField(blank=True, null=True)
    image = models.CharField(max_length=1000, blank=True, null=True)
    color = models.CharField(max_length=7, default="#000000")
    is_ai_enabled = models.BooleanField(default=False)
    github_integration_id = models.IntegerField(blank=True, null=True)
    is_archived = models.BooleanField(default=False)
    date_archivage = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = "projects"

    def __str__(self):
        return self.name


class ProjectToIntegration(models.Model):
    INTEGRATION_CHOICES = [
        ("github", "GitHub"),
    ]

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="integrations")
    integration_id = models.CharField(max_length=32, choices=INTEGRATION_CHOICES, default="github")
    user_id = models.CharField(max_length=32)

    class Meta:
        db_table = "project_to_integrations"


class UsersToProjects(models.Model):
    USER_ROLE_CHOICES = [
        ("owner", "Owner"),
        ("admin", "Admin"),
        ("member", "Member"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="users_to_projects")
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="users")
    user_role = models.CharField(max_length=16, choices=USER_ROLE_CHOICES)
    skills = models.CharField(max_length=30, default ="")

    class Meta:
        db_table = "users_to_projects"
        unique_together = ("user", "project")


class Invite(models.Model):
    date = models.DateTimeField(auto_now_add=True)
    token = models.CharField(max_length=255, unique=True)
    user_id = models.CharField(max_length=32)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="invites")

    class Meta:
        db_table = "invites"


class Sprint(models.Model):
    start_date = models.DateTimeField(auto_now_add=True)
    end_date = models.DateTimeField(blank=True, null=True)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="sprints")

    class Meta:
        db_table = "sprints"

    def __str__(self):
        return f"Sprint {self.id} - {self.project.name}"


