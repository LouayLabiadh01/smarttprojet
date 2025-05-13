from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.timezone import make_aware
from datetime import datetime, timedelta
import json
import random
import logging
from .user import add_user_to_project  # à créer dans user.py
from .invite import create_invite  # à créer dans invite.py
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .models import Project, UsersToProjects
from taches.models import Task, TaskHistory 
from users.models import User
from .serializers import ProjectSerializer, UserSerializer, NewProjectSerializer
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils.timezone import localtime
from django.db.models.functions import TruncWeek
import traceback

from projects.invite import join_project

# projects/views.py
from rest_framework.decorators import permission_classes
from rest_framework.permissions import IsAuthenticated

from .sprint import get_sprints_for_project, get_current_sprint_for_project, update_sprints_for_project


from django.conf import settings
from .sprint import create_sprint_for_project
from projects.models import  Sprint
from django.utils import timezone

from django.core.cache import cache
import json
from django.db.models import Count, Q
from taches.serializers import TaskSerializer




@api_view(["POST"])
def check_permissions(request):
    user_id = request.data.get("userId")
    project_id = request.data.get("projectId")
    roles = request.data.get("roles", [])

    if not user_id or not project_id:
        return Response({"error": "Les champs 'userId' et 'projectId' sont requis."}, status=400)

    try:
        user = User.objects.get(user_id=user_id)
    except User.DoesNotExist:
        return Response({"error": "Utilisateur introuvable."}, status=404)

    try:
        relation = UsersToProjects.objects.get(project_id=project_id, user=user)
    except UsersToProjects.DoesNotExist:
        return Response({"error": "L'utilisateur n'a pas accès à ce projet."}, status=403)
    except Exception as e:
        return Response({"error": f"Erreur serveur : {str(e)}"}, status=500)

    if roles and relation.user_role not in roles:
        return Response(
            {"error": f"Le rôle '{relation.user_role}' de l'utilisateur ne permet pas d'accéder à cette ressource."},
            status=403
        )

    return Response({"status": "ok"})



@api_view(['GET', 'POST'])
def project_application_data(request):
    user_id = str(request.user.id)
    cache_key = f"project_app_data_{user_id}"

    if request.method == 'GET':
        data = cache.get(cache_key)
        if not data:
            return Response({"detail": "No project data"}, status=status.HTTP_404_NOT_FOUND)
        return Response(data)

    if request.method == 'POST':
        try:
            data = request.data
            cache.set(cache_key, data, timeout=None)
            return Response({"detail": "Project data saved"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def auto_sprint_view(request):
    auth_header = request.headers.get('Authorization')
    if auth_header != f"Bearer {settings.CRON_SECRET}":
        return Response({"error": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)

    project_id = request.GET.get('projectId')
    results = {}

    if project_id:
        try:
            projects_to_run = [Project.objects.get(id=project_id)]
        except Project.DoesNotExist:
            return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)
    else:
        projects_to_run = Project.objects.all()

    now = timezone.now()

    for project in projects_to_run:
        results[project.id] = []

        while True:
            sprints_for_project = Sprint.objects.filter(project=project).order_by('end_date')
            current_sprint = next((s for s in sprints_for_project if s.start_date <= now <= s.end_date), None)

            if current_sprint:
                next_sprints_count = sprints_for_project.count() - 1 - list(sprints_for_project).index(current_sprint)
                if next_sprints_count == 0:
                    new_sprint = create_sprint_for_project(project.id)
                    if new_sprint:
                        results[project.id].append(new_sprint)
                    break
                else:
                    break
            else:
                first_sprint = sprints_for_project.first()
                if first_sprint and first_sprint.end_date > now:
                    break
                new_sprint = create_sprint_for_project(project.id)
                if new_sprint:
                    results[project.id].append(new_sprint)
                    continue

    return Response(results, status=status.HTTP_200_OK)


@api_view(['GET'])
def get_sprints(request, project_id):
    data = get_sprints_for_project(project_id)
    print(data)
    return Response(data)


@api_view(['GET'])
def get_current_sprint(request, project_id):
    sprint = get_current_sprint_for_project(project_id)
    print(sprint)
    if not sprint:
        return Response(None)
    return Response({
        "id": sprint.id,
        "start_date": sprint.start_date,
        "end_date": sprint.end_date,
    })



@api_view(['POST'])
def update_sprints(request, project_id):
    print(request.data)
    sprint_duration_weeks = int(request.data.get("sprintDuration"))
    sprint_start_str = request.data.get("sprintStart")

    # Convert ISO date string to datetime object using strptime
    sprint_start = datetime.strptime(sprint_start_str, "%Y-%m-%dT%H:%M:%S.%fZ")

    project = get_object_or_404(Project, pk=project_id)
    project.sprint_duration = sprint_duration_weeks
    project.sprint_start = sprint_start
    project.save()

    # Update all related sprints
    sprints = Sprint.objects.filter(project=project).order_by("start_date")
    for idx, sprint in enumerate(sprints):
        start_date = sprint_start + timedelta(weeks=idx * sprint_duration_weeks)
        end_date = start_date + timedelta(weeks=sprint_duration_weeks)

        sprint.start_date = start_date
        sprint.end_date = end_date
        sprint.save()

    return Response({"success": True})



@api_view(['POST'])
def api_create_invite(request):
    user_id = request.data.get("userId")
    project_id = request.data.get("projectId")
    if not user_id or not project_id:
        return Response({"success": False, "message": "Invalid data"}, status=400)
    
    token = create_invite(user_id, int(project_id))
    return Response({"success": True, "token": token})


@api_view(['POST'])
def api_join_project(request):
    user_id = request.data.get("userId")
    token = request.data.get("token")
    if not user_id or not token:
        return Response({"success": False, "message": "Invalid data"}, status=400)
    
    result = join_project(user_id, token)
    print(result)
    return Response(result)



@api_view(["POST"])
def api_add_user_to_project(request):
    user_id = request.data.get("user_id")
    project_id = request.data.get("project_id")
    role = request.data.get("role", "member")

    if not user_id or not project_id:
        return Response(
            {"detail": "user_id and project_id are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    success = add_user_to_project(user_id, project_id, role)

    if success:
        return Response({"status": True, "message": "User added to project"})
    else:
        return Response(
            {"status": False, "message": "Failed to add user (maybe already exists)"},
            status=status.HTTP_400_BAD_REQUEST,
        )


logger = logging.getLogger(__name__)

PROJECT_COLOR_OPTIONS = [
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFBE0B",
    "#FF006E", "#8338EC", "#3A86FF", "#FB5607", "#38B000",
    "#7209B7", "#F15BB5", "#00AFB9", "#0077B6", "#9B5DE5"
]

def get_random_color():
    return random.choice(PROJECT_COLOR_OPTIONS)

def parse_iso_datetime(date_str):
    formats = [
        "%Y-%m-%dT%H:%M:%S.%fZ",   # avec millisecondes et Z
        "%Y-%m-%dT%H:%M:%S.%f",    # avec millisecondes sans Z
        "%Y-%m-%dT%H:%M:%S",       # sans millisecondes
    ]
    
    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            continue
    raise ValueError(f"Format de date non reconnu: {date_str}")

@csrf_exempt
def create_project(request):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        data = json.loads(request.body)

        user_id = request.headers.get("X-User-Id")  # simulation de l’authentification
        if not user_id:
            return JsonResponse({"error": "Unauthorized"}, status=401)

        start = data['sprint_start'].replace('Z', '')
        sprint_start = parse_iso_datetime(start)
        sprint_start += timedelta(minutes=data.get("timezoneOffset", 0))
        sprint_start = make_aware(sprint_start)


        new_project = Project.objects.create(
            name=data["name"],
            sprint_duration=data["sprint_duration"],
            sprint_start=sprint_start,
            description=data.get("description"),
            is_ai_enabled=data.get("is_ai_enabled", False),
            color=get_random_color()
        )

        # Lier l'utilisateur comme owner
        add_user_to_project(user_id, new_project.id, "owner")

        # ❌ Sprint creation skipped
        create_sprint_for_project(new_project.id)

        # Créer une invitation
        token = create_invite(user_id, new_project.id)

        return JsonResponse({
            "newProjectId": new_project.id,
            "inviteToken": token,
            "status": True,
            "message": f'Project "{new_project.name}" created'
        })

    except Exception as e:
        logger.error(f"Error creating project: {e}")
        msg = str(e)
        if "UNIQUE constraint failed" in msg:
            msg = "Project name already exists"
        return JsonResponse({
            "newProjectId": -1,
            "inviteToken": None,
            "status": False,
            "message": msg
        })

@api_view(['GET'])
def get_all_projects(request, user_id):
    try:
        projects = Project.objects.filter(users__user_id=user_id)
        serializer = ProjectSerializer(projects, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_project(request, project_id, user_id):
    try:
        project = get_object_or_404(Project, pk=project_id)
        user_link = UsersToProjects.objects.filter(project=project, user_id=user_id).first()
        if not user_link:
            return Response({'error': f'Project {project_id} is not related to your account'}, status=403)

        serializer = ProjectSerializer(project)
        return Response({'data': serializer.data})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
def update_project(request, project_id):
    try:
        project = get_object_or_404(Project, pk=project_id)
        serializer = NewProjectSerializer(project, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({'data': serializer.data})
        return Response(serializer.errors, status=400)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_assignees_for_project(request, project_id):
    try:
        project = get_object_or_404(Project, pk=project_id)
        users = User.objects.filter(users_to_projects__project=project).distinct()
        serializer = UserSerializer(users, many=True)
        print("Serialized users data:", serializer.data)

        return Response({'data': serializer.data})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_all_users_in_project(request, project_id):
    try:
        user_links = UsersToProjects.objects.filter(project_id=project_id).select_related('project')
        data = [
            {
                **UserSerializer(user_link.user).data,
                'user_role': user_link.user_role
            }
            for user_link in user_links if user_link.user
        ]
        return Response(data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(["DELETE"])
def remove_user_from_project(request, project_id):
    user_id = request.data.get("user_id")
    if not user_id:
        return Response({"error": "User ID is required"}, status=400)

    UsersToProjects.objects.filter(project=project_id, user=user_id).delete()

    Task.objects.filter(projectId=project_id, assignee=user_id).update(assignee=None)

    return Response({"message": f"User {user_id} removed from project {project_id}"}, status=200)

@api_view(["DELETE"])
def delete_project(request, project_id):
    project = get_object_or_404(Project, id=project_id)
    
    # You could also check if request.user is owner here for extra security
    project.delete()

    return Response({"message": f"Project {project_id} deleted successfully"}, status=200)

@api_view(["PATCH"])
def edit_user_role(request, project_id, user_id):
    new_role = request.data.get("role")

    if new_role not in ["owner", "admin", "member"]:
        return Response({"error": "Invalid role"}, status=400)

    user_to_project = get_object_or_404(
        UsersToProjects,
        project_id=project_id,
        user_id=user_id,
    )
    user_to_project.user_role = new_role
    user_to_project.save()

    return Response({"message": "User role updated successfully"}, status=200)



def current_sprint_graph(request, project_id):
    try:
        sprints = Sprint.objects.filter(project=project_id)
        print(sprints)
        current_sprint = get_current_sprint_for_project(project_id)
        print(current_sprint)
        if not current_sprint:
            return JsonResponse({"error": "No active sprint"}, status=404)

        sprint_tasks_qs = Task.objects.filter(
            projectId=project_id,
            sprintId=current_sprint
        ).values('id', 'status', 'points', 'inserted_date', 'last_edited_at')

        print(sprint_tasks_qs)

        sprint_tasks = []
        task_ids = []

        for task in sprint_tasks_qs:
            sprint_tasks.append({
                "id": task["id"],
                "status": task["status"],
                "points": task["points"],
                "insertDate": task["inserted_date"].isoformat(),
                "editedDate": task["last_edited_at"].isoformat() if task["last_edited_at"] else None
            })
            task_ids.append(task["id"])

        if not task_ids:
            return JsonResponse([], safe=False)
        print(sprint_tasks)
        print(task_ids)

        history_qs = TaskHistory.objects.filter(
            property_key="status",
            task__in=task_ids
        ).select_related("task").order_by("-inserted_date")
        print(history_qs)

        task_history = []
        for entry in history_qs:
            task_history.append({
                "propertyValue": entry.property_value,
                "insertedDate": entry.inserted_date.isoformat(),
                "task": {
                    "id": entry.task.id,
                    "status": entry.task.status,
                    "points": entry.task.points
                }
            })
        print(task_history)
        return JsonResponse({
            "sprint": {
                "id": current_sprint.id,
                "name": str(current_sprint),
                "startDate": current_sprint.start_date.isoformat(),
                "endDate": current_sprint.end_date.isoformat(),
            },
            "sprintTasks": sprint_tasks,
            "taskHistory": task_history,
        })

    except Exception as e:
        print("Error occurred:", e)
        traceback.print_exc()  # <- Add this line
        return JsonResponse({"error": str(e)}, status=500)

def archived_projects(request):
    archived = Project.objects.filter(is_archived=True).values()
    return JsonResponse(list(archived), safe=False)

@api_view(["PATCH"])
def archive_project(request, pk):
	try:
		project = Project.objects.get(pk=pk)
		project.is_archived = True
		project.save()
		return Response({"message": "Project archived."}, status=status.HTTP_200_OK)
	except Project.DoesNotExist:
		return Response({"error": "Not found."}, status=status.HTTP_404_NOT_FOUND)

@api_view(["PATCH"])
def unarchive_project(request, pk):
    try:
        project = Project.objects.get(pk=pk)
        project.is_archived = False
        project.save()
        return Response({"message": "Project unarchived."}, status=status.HTTP_200_OK)
    except Project.DoesNotExist:
        return Response({"error": "Not found."}, status=status.HTTP_404_NOT_FOUND)


@api_view(["GET"])
def get_projects_report(request):
    projects = Project.objects.all()
    data = []

    for project in projects:
        tasks = Task.objects.filter(projectId=project)
        total = tasks.count()
        done = tasks.filter(status="done").count()
        in_progress = tasks.filter(status="inprogress").count()

        # Tasks by week
        tasks_by_week = tasks.filter(status="done").count()

        # Tasks by sprint
        sprint_data = []
        sprint_start = project.sprint_start
        sprint_duration = project.sprint_duration
        current = sprint_start
        sprint_index = 1

        while current < timezone.now():
            next_sprint = current + timedelta(days=sprint_duration)
            current_sprint =  Sprint.objects.filter(start_date=current, project=project).first()
            count = tasks.filter(status="done", sprintId = current_sprint).count()
            sprint_data.append({"name": f"Sprint {sprint_index}", "value": count})
            current = next_sprint
            sprint_index += 1

        # Serialize tasks
        serialized_tasks = []
        for task in tasks :
            serialized_tasks.append(TaskSerializer(task).data)
        print(serialized_tasks)
        data.append({
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "color": project.color,
            "sprint_duration": project.sprint_duration,
            "sprint_start": project.sprint_start,
            "image": project.image,
            "is_ai_enabled": project.is_ai_enabled,
            "is_archived": project.is_archived,
            "tasks_summary": {
                "total": total,
                "done": done,
                "in_progress": in_progress
            },
            "charts": {
                "by_week": tasks_by_week,
                "by_sprint": sprint_data,
                "status": [
                    {"name": "À faire", "value": tasks.filter(status="todo").count()},
                    {"name": "En cours", "value": in_progress},
                    {"name": "Terminées", "value": done},
                ]
            },
            "tasks": serialized_tasks
        })

    return Response(data)