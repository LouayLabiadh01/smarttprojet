# serializers.py
from rest_framework import serializers
from .models import Archive
from .models import Quicklink
from .models import Sticky, ChecklistItem

class ArchivedProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Archive
        fields = '__all__'

class QuicklinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quicklink
        fields = ['id', 'title', 'url', 'created_at']



class ChecklistItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChecklistItem
        fields = ['id', 'text', 'checked']

class StickySerializer(serializers.ModelSerializer):
    items = ChecklistItemSerializer(many=True, read_only=True)

    class Meta:
        model = Sticky
        fields = ['id', 'title', 'content', 'color', 'type', 'items']
