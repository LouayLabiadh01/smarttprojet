import hashlib
from datetime import datetime, timedelta

from .user import add_user_to_project

from django.db.models import Q
from django.utils.timezone import now

from projects.models import Invite, Project, UsersToProjects
from users.models import User

# Les imports externes doivent rester dans invite-actions.tsx

def create_invite(user_id: str, project_id: int):
    data = {
        'userId': user_id,
        'projectId': project_id
    }

    invite_date = now()
    existing_invite = Invite.objects.filter(
        user_id=user_id,
        project_id=project_id
    ).first()

    if existing_invite:
        age = (invite_date - existing_invite.date).days
        if age < 5:
            return existing_invite.token
        existing_invite.delete()

    stringified = str({
        "userId": user_id,
        "projectId": project_id,
        "date": invite_date.isoformat()
    }).encode("utf-8")
    token = hashlib.sha256(stringified).digest()
    token = token.hex().replace("/", "-")  # Similar to base64 with replacement

    Invite.objects.create(
        user_id=user_id,
        project_id=project_id,
        token=token,
        date=invite_date
    )
    return token


def join_project(user_id: str, token: str):
    invite = Invite.objects.filter(token=token).first()
    if not invite:
        return {"success": False, "message": "No invite link was provided"}

    age = (now() - invite.date).days
    if age > 5:
        return {"success": False, "message": "Invite link expired"}

    try:
        success = add_user_to_project(user_id,invite.project_id,"member")
    except:
        return {
            "success": True,
            "message": "You have already joined this project",
            "projectId": invite.project_id,
        }

    invited_user = User.objects.filter(user_id=user_id).first()
    User_project = UsersToProjects.objects.filter(user_role="owner").first()
    owner = User_project.user

    return {
        "success": True,
        "message": "You have successfully joined this project",
        "projectId": invite.project_id,
        "userId":owner.user_id,
        "taskId" : "",
    }
