from django.db import models

class User(models.Model):
    user_id = models.CharField(
        primary_key=True,
        max_length=32,
        verbose_name="Clerk User ID"
    )
    username = models.CharField(max_length=255, null=True, blank=True)
    profilePicture = models.CharField(max_length=255)
    role = models.CharField(max_length=255, default = "Membre")

    class Meta:
        db_table = "users"
        indexes = [
            models.Index(fields=['username']),
        ]

    def __str__(self):
        return f"{self.username} ({self.user_id})"
