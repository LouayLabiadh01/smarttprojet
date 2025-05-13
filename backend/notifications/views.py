# notifications/views.py

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Notification
from users.models import User
from taches.models import Task
from projects.models import Project
from .serializers import NotificationSerializer
from django.utils.timezone import now
from django.shortcuts import get_object_or_404


@api_view(["POST"])
def create_notification(request):
    data = request.data
    print(data)
    if data["taskId"] :
        task = get_object_or_404(Task, id=data["taskId"])
        user = User.objects.filter(username = data["user_id"]).first()
        projet = get_object_or_404(Project, id=data["projectId"])
        data.pop("taskId", None)
        data.pop("user_id", None)
        data.pop("projectId", None)
        notification = Notification.objects.create(
                **data,
                taskId = task,
                user = user,
                projectId = projet,
            )
    else :
        user = User.objects.filter(user_id = data["user_id"]).first()
        projet = get_object_or_404(Project, id=data["projectId"])
        data.pop("taskId", None)
        data.pop("user_id", None)
        data.pop("projectId", None)
        notification = Notification.objects.create(
                **data,
                user = user,
                projectId = projet,
            )
    return Response({"message": "notification added", "id": notification.id})

@api_view(["GET"])
def get_notification(request, pk):
    notification = get_object_or_404(Notification, pk=pk)
    serializer = NotificationSerializer(notification)
    return Response(serializer.data)


@api_view(["GET"])
def get_all_notifications(request, user_id):
    notifications = Notification.objects.filter(user=user_id).order_by("-date").select_related("taskId")
    serializer = NotificationSerializer(notifications, many=True)
    return Response({"data": serializer.data, "error": None})


@api_view(["PATCH"])
def read_notification(request, pk):
    notification = get_object_or_404(Notification, pk=pk)
    notification.read_at = now()
    notification.save()
    return Response({"success": True})


@api_view(["PATCH"])
def unread_notification(request, pk):
    notification = get_object_or_404(Notification, pk=pk)
    notification.read_at = None
    notification.save()
    return Response({"success": True})


@api_view(["DELETE"])
def delete_notification(request, pk):
    notification = get_object_or_404(Notification, pk=pk)
    notification.delete()
    return Response({"success": True})


@api_view(["DELETE"])
def delete_all_notifications(request, user_id):
    Notification.objects.filter(user_id=user_id).delete()
    return Response({"success": True})


@api_view(["PATCH"])
def read_all_notifications(request, user_id):
    Notification.objects.filter(user_id=user_id).update(read_at=now())
    return Response({"success": True})
