import requests
from datetime import datetime, timedelta
from django.db import transaction
from .models import Sprint, Project
from .utils import get_user_related_to_project  # This utility can be created to check user relationship to project

from django.utils import timezone
from django.db.models import Max

def add_weeks(start_date, weeks):
    return start_date + timedelta(weeks=weeks)

def create_sprint_for_project(project_id):
    try:
        project = Project.objects.get(id=project_id)
    except Project.DoesNotExist:
        print(f"Attempted to create sprint for non-existent project {project_id}")
        return None

    new_sprint_start = project.sprint_start

    last_sprint = Sprint.objects.filter(project_id=project_id).order_by('-end_date').first()
    if last_sprint:
        new_sprint_start = last_sprint.end_date

    new_sprint_end = add_weeks(new_sprint_start, project.sprint_duration)

    new_sprint = Sprint.objects.create(
        project=project,
        start_date=new_sprint_start,
        end_date=new_sprint_end
    )

    return {
        "startDate": new_sprint.start_date,
        "endDate": new_sprint.end_date
    }


from .serializers import SprintSerializer

def get_sprints_for_project(project_id):
    """Fetch all sprints for a given project."""
    sprints = Sprint.objects.filter(project=project_id)
    serialized_sprints = SprintSerializer(sprints, many=True).data
    return [
        {
            "name": f"Sprint {index + 1}",
            **sprint
        }
        for index, sprint in enumerate(serialized_sprints)
    ]



def get_current_sprint_for_project(project_id):
    """Fetch the current sprint for a project."""
    now = datetime.now()
    current_sprints = Sprint.objects.filter(
        project=project_id,
    ).order_by('end_date')

    return current_sprints.first() if current_sprints.exists() else None


def update_sprints_for_project(project_id, sprint_duration, sprint_start):
    """Update the sprints for a project by adjusting their start and end dates."""
    user_related = get_user_related_to_project(project_id)  # Get user id and check project relation
    if not user_related:
        return False

    # Update project details
    project = Project.objects.get(id=project_id)
    project.sprint_duration = sprint_duration
    project.sprint_start = sprint_start
    project.save()

    # Fetch current and future sprints
    current_and_future_sprints = Sprint.objects.filter(
        project_id=project_id,
        end_date__gte=datetime.now()
    )

    with transaction.atomic():
        for i, sprint in enumerate(current_and_future_sprints):
            new_sprint_start = sprint_start + timedelta(weeks=i * sprint_duration)
            new_sprint_end = sprint_start + timedelta(weeks=(i + 1) * sprint_duration)

            sprint.start_date = new_sprint_start
            sprint.end_date = new_sprint_end
            sprint.save()


    return True