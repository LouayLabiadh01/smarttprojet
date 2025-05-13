from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Archive
from .serializers import ArchivedProjectSerializer

@api_view(['GET'])
def get_archived_projects(request):
    archives = Archive.objects.all()
    serializer = ArchivedProjectSerializer(archives, many=True)
    return Response(serializer.data)

