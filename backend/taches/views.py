from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .models import Task, TaskHistory, TaskToView,Comment, TaskToView
from projects.models import Sprint, Project
from users.models import User
from .serializers import TaskSerializer, CreateTaskSerializer, UpdateTaskSerializer, CommentViewSerializer

from django.db.models import Max, Q, F
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.timezone import now
from django.views.decorators.csrf import csrf_exempt

from .serializers import SprintSerializer, TaskHistorySerializer, TaskViewSerializer

@api_view(['GET'])
def sprints_by_project(request, project_id):
    sprints = Sprint.objects.filter(project_id=project_id)
    serializer = SprintSerializer(sprints, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def tasks_by_project_and_sprint(request, project_id, sprint_id):
    tasks = Task.objects.filter(project_id=project_id, sprint_id=sprint_id)
    serializer = TaskSerializer(tasks, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def task_history_by_task_ids(request):
    ids = request.GET.get("ids", "")
    try:
        id_list = [int(i) for i in ids.split(",") if i.isdigit()]
    except ValueError:
        return Response({"error": "Invalid ID list."}, status=status.HTTP_400_BAD_REQUEST)

    histories = TaskHistory.objects.filter(property_key="status", task_id__in=id_list).select_related("task").order_by("-inserted_date")
    serializer = TaskHistorySerializer(histories, many=True)
    return Response(serializer.data)

@api_view(["GET"])
def get_recent_tasks(request, project_id):
    user = request.user
    number = int(request.query_params.get("number", 5))

    viewed_tasks = TaskToView.objects.filter(user=user).select_related("task").order_by("-viewed_at")
    edited_tasks = Task.objects.filter(projectId=project_id).order_by("-last_edited_at")
    created_tasks = Task.objects.filter(projectId=project_id).order_by("-inserted_date")

    def categorize(tasks, category, timestamp_field):
        return [
            {
                **TaskSerializer(task.task if category == "viewed" else task).data,
                "category": category,
                "categoryTimestamp": getattr(task, timestamp_field) if category != "viewed" else task.viewed_at
            }
            for task in tasks
        ]

    categorized = {
        "viewed": categorize(viewed_tasks, "viewed", "viewed_at"),
        "created": categorize(created_tasks, "created", "inserted_date"),
        "edited": categorize(edited_tasks, "edited", "last_edited_at")
    }

    seen_ids = set()
    result = []

    def distribute(category, limit):
        count = 0
        for task in categorized[category]:
            if task["id"] not in seen_ids and count < limit:
                result.append(task)
                seen_ids.add(task["id"])
                count += 1

    limits = {
        "viewed": (number + 2) // 3,
        "created": (number + 1) // 3,
        "edited": number // 3,
    }

    for cat in ["viewed", "created", "edited"]:
        distribute(cat, limits[cat])

    for cat in ["viewed", "created", "edited"]:
        for task in categorized[cat]:
            if task["id"] not in seen_ids and len(result) < number:
                result.append(task)
                seen_ids.add(task["id"])

    return Response(result)



@api_view(["POST"])
def create_task(request):
    data = request.data
    user_id = request.headers.get('Authorization')
    user_h = User.objects.filter(user_id=user_id).first()
    username = data['assignee']
    user = User.objects.filter(username = username).first()
    sprint = Sprint.objects.filter(id = data['sprintId']).first()
    projet = Project.objects.filter(id = data['projectId']).first()
    #max_backlog = Task.objects.filter(projectId=data["projectId"]).aggregate(Max("backlogOrder"))["backlog_order__max"]
    #backlog_order = (max_backlog + 1) if max_backlog is not None else 0
    data.pop("sprintId", None)
    data.pop("assignee", None)
    data.pop("branchName", None)
    data.pop("projectId", None)
    task = Task.objects.create(
        **data,
        sprintId = sprint,
        assignee = user,
        projectId = projet,
        #backlogOrder=backlog_order,
        branchName="",  # Leave blank or generate on frontend
    )

    TaskHistory.objects.create(
        task=task,
        user=user_h,
        property_key="assignee",
        property_value=data.get("assignee", ""),
        comment="Created the task",
        inserted_date=timezone.now()
    )

    return Response(TaskSerializer(task).data, status=201)


@api_view(["GET"])
def get_tasks_from_project(request, project_id):
    tasks = Task.objects.filter(projectId=project_id)
    response = []
    for task in tasks :
        rep = TaskSerializer(task).data
        assignee = rep.get("assignee")
        if assignee and isinstance(assignee, dict):
            rep["assignee"] = assignee.get("username")
        else:
            rep["assignee"] = None
            
        response.append(rep)

    return Response(response)


@api_view(["GET"])
def get_all_active_tasks_for_project(request, project_id):
    tasks = Task.objects.filter(
        project_id=project_id
    ).exclude(status__in=["todo", "inprogress", "done"])
    return Response(TaskSerializer(tasks, many=True).data)


@api_view(["DELETE"])
def delete_task(request, task_id):
    task = get_object_or_404(Task, id=task_id)

    Task.objects.filter(
        projectId=task.projectId,
        backlogOrder=task.backlogOrder
    ).update(backlogOrder=F("backlogOrder") - 1)

    task.delete()
    return Response({"detail": "Task deleted."}, status=204)


@api_view(["PATCH"])
def update_task(request, task_id):
    task = get_object_or_404(Task, id=task_id)
    data = request.data 
        
    user_id = request.headers.get('Authorization')
    user = User.objects.filter(user_id=user_id).first()

    for key, value in data.items():
        if key == 'assignee':
            value = User.objects.filter(username=value).first()
        if key == "projectId":
            continue
        if key == 'sprintId':
            if value == 'null' :
                continue
            else:
                value = Sprint.objects.filter(id = value).first()
        setattr(task, key, value)

    task.last_edited_at = timezone.now()
    task.save()
    return Response(TaskSerializer(task).data)

@api_view(["GET"])
def get_task_activity(request, task_id):
    try:
        task = Task.objects.get(id=task_id)
    except Task.DoesNotExist:
        return Response({"error": "Task not found"}, status=404)

    task_history = TaskHistory.objects.filter(task=task).order_by("-inserted_date")
    task_views = TaskToView.objects.filter(task=task).order_by("-viewed_at")
    comments = Comment.objects.filter(task=task).order_by("-inserted_date")

    return Response({
        "taskHistory": TaskHistorySerializer(task_history, many=True).data,
        "lastViews": TaskViewSerializer(task_views, many=True).data,
        "comments": CommentViewSerializer(comments, many=True).data,
    })

@api_view(["GET"])
def get_task(request, task_id):
    task = get_object_or_404(Task.objects.select_related("projectId"), id=task_id)
    rep = TaskSerializer(task).data
    assignee = rep.get("assignee")
    if assignee and isinstance(assignee, dict):
        rep["assignee"] = assignee.get("username")
    else:
        rep["assignee"] = None
    return Response(rep)

@api_view(["POST"])
def post_task_comment(request, task_id):
    try:
        task = Task.objects.get(id=task_id)
    except Task.DoesNotExist:
        return Response({"error": "Task not found"}, status=404)

    comment_text = request.data.get("comment")
    user_id = request.data.get("user_id")
    inserted_date = request.data.get("inserted_date")

    if not comment_text or not user_id or not inserted_date:
        return Response({"error": "Missing required fields"}, status=400)

    user = get_object_or_404(User, user_id=user_id)

    comment = Comment.objects.create(
        task=task,
        user=user,
        comment=comment_text,
        inserted_date=inserted_date
    )

    return Response({"message": "Comment added", "id": comment.id})

@api_view(["DELETE"])
def delete_comment(request, delete_id):
    comment = get_object_or_404(Comment, id=delete_id)

    comment.delete()
    return Response({"detail": "Task deleted."}, status=204)


@api_view(["POST"])
def create_task_history(request, task_id):

    task = get_object_or_404(Task, id=task_id)
    data = request.data[0]
    print(data)
    user_id = data['user']
    user = User.objects.filter(user_id=user_id).first()
    data.pop("task", None)
    data.pop("user", None)
    taskhistory = TaskHistory.objects.create(
            **data,
            task = task,
            user = user,
        )
        
    return Response({"message": "task history added", "id": taskhistory.id})



@csrf_exempt
@api_view(["POST"])
def update_or_insert_task_view(request, task_id): 
    task = get_object_or_404(Task, id=task_id)
    user_id = request.headers.get('Authorization')
    user = User.objects.filter(user_id=user_id).first()
    obj, created = TaskToView.objects.update_or_create(
        task=task,
        user=user,
        defaults={'viewed_at': now()}
    )

    return Response({"message": "task view added", "id": obj.id})
