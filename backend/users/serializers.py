from rest_framework import serializers
from .models import User

class ClerkWebhookSerializer(serializers.Serializer):
    type = serializers.CharField()
    data = serializers.DictField()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['user_id', 'username', 'profilePicture']



class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'
