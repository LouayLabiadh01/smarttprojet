from rest_framework import serializers
from .models import Task, TaskHistory, TaskToView, Comment


from rest_framework import serializers
from projects.models import Sprint
from datetime import datetime
from projects.serializers import UserSerializer


class SprintSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sprint
        fields = ["id", "name", "start_date", "end_date", "project"]


class SprintTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ["id", "status", "points", "inserted_date", "last_edited_at"]


class TaskHistorySerializer(serializers.ModelSerializer):
    task = SprintTaskSerializer()

    class Meta:
        model = TaskHistory
        fields = ["id", "property_key", "property_value", "inserted_date", "task"]


class TaskSerializer(serializers.ModelSerializer):
    assignee = UserSerializer(read_only=True)

    class Meta:
        model = Task
        fields = "__all__"


class CreateTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        exclude = ["id", "backlogOrder", "branchName", "sprintId", "status","assignee"]


class UpdateTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        exclude = ["id", "backlogOrder", "branchName", "sprintId", "status"]




class TaskHistorySerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    task = TaskSerializer(read_only=True)
    class Meta:
        model = TaskHistory
        fields = '__all__'

class TaskViewSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskToView
        fields = '__all__'

class CommentViewSerializer(serializers.ModelSerializer):
    inserted_date = serializers.SerializerMethodField()
    user = UserSerializer(read_only=True)
    task = TaskSerializer(read_only=True)

    def get_inserted_date(self, obj):
        # Format with 3-digit milliseconds
        return obj.inserted_date.strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"

    class Meta:
        model = Comment
        fields = '__all__'

# serializers.py
class TaskHistoryCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskHistory
        fields = ["property_key", "property_value", "old_property_value", "inserted_date"]

    def create(self, validated_data):
        return TaskHistory.objects.create(
            **validated_data,
            task_id=self.context["task_id"],
            user=self.context["user"]
        )
