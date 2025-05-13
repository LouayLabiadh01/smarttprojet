from rest_framework import serializers
from .models import Project, Sprint
from users.models import User

# serializers.py

class SprintSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sprint
        fields = '__all__'


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = '__all__'


class NewProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        exclude = ['id']  # ou fields explicites si besoin


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['user_id', 'username', 'profilePicture']  # adapte selon ton modèle `User`

