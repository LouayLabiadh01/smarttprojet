# serializers.py
from rest_framework import serializers
from .models import Archive

class ArchivedProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Archive
        fields = '__all__'
