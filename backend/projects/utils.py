from users.models import User
from .models import UsersToProjects

def get_user_related_to_project(user_id, project_id):
    """Check if the user is related to the project (i.e., is part of the project)."""
    try:
        return UsersToProjects.objects.filter(user_id=user_id, project_id=project_id).exists()
    except Exception as e:
        raise Exception(f"Error checking user relationship: {e}")