# projects/user.py

from .models import UsersToProjects,Project
from users.models import User
from django.db import IntegrityError


def add_user_to_project(user_id: str, project_id: int, role: str = "member") -> bool:
    try:
        user = User.objects.get(user_id=user_id)
        project = Project.objects.get(id=project_id)

        UsersToProjects.objects.create(
            user=user,
            project=project,
            user_role=role,
        )
        return True
    except (IntegrityError, User.DoesNotExist, Project.DoesNotExist):
        return False
