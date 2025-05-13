from rest_framework import serializers
from .models import Notification

from taches.serializers import TaskSerializer
from projects.serializers import ProjectSerializer
from projects.serializers import UserSerializer


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'


class NotificationDetailSerializer(serializers.ModelSerializer):
    userId = UserSerializer(read_only=True)
    taskId = TaskSerializer(read_only=True)
    projectId = ProjectSerializer(read_only=True)

    class Meta:
        model = Notification
        fields = '__all__'
