from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Archive, Quicklink
from .serializers import ArchivedProjectSerializer, QuicklinkSerializer
from django.shortcuts import get_object_or_404

from .models import Sticky, ChecklistItem
from .serializers import StickySerializer, ChecklistItemSerializer

from users.models import User

@api_view(['GET'])
def get_archived_projects(request):
    archives = Archive.objects.all()
    serializer = ArchivedProjectSerializer(archives, many=True)
    return Response(serializer.data)



@api_view(['GET'])
def get_quicklinks(request):
    user_id = request.query_params.get("user")
    if not user_id:
        return Response({"detail": "Missing user ID."})

    quicklinks = Quicklink.objects.filter(user__user_id=user_id).order_by('-created_at')
    serializer = QuicklinkSerializer(quicklinks, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def create_quicklink(request):
    user_id = request.data.get("user")
    if not user_id:
        return Response({"detail": "Missing user ID."})

    try:
        user = User.objects.get(user_id=user_id)
    except User.DoesNotExist:
        return Response({"detail": "User not found."})

    serializer = QuicklinkSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(user=user)
        return Response(serializer.data)
    return Response(serializer.errors)

@api_view(['DELETE'])
def delete_quicklink(request, pk):
    user_id = request.query_params.get("user")
    if not user_id:
        return Response({"detail": "Missing user ID."})

    try:
        quicklink = Quicklink.objects.get(pk=pk, user__user_id=user_id)
    except Quicklink.DoesNotExist:
        return Response({"detail": "Quicklink not found or unauthorized."})

    quicklink.delete()
    return Response({"detail": "Deleted successfully."})


@api_view(['GET'])
def get_stickies(request):
    user_id = request.query_params.get("user")
    if not user_id:
        return Response({"detail": "Missing user ID"}, status=400)

    stickies = Sticky.objects.filter(user__user_id=user_id).prefetch_related('items').order_by('-created_at')
    serializer = StickySerializer(stickies, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def create_sticky(request):
    user_id = request.data.get("user")
    if not user_id:
        return Response({"detail": "Missing user ID"}, status=400)

    try:
        user = User.objects.get(user_id=user_id)
    except User.DoesNotExist:
        return Response({"detail": "User not found"}, status=404)

    serializer = StickySerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(user=user)
        return Response(serializer.data)
    return Response(serializer.errors, status=400)


@api_view(['PATCH'])
def update_sticky(request, pk):
    sticky = get_object_or_404(Sticky, pk=pk)
    serializer = StickySerializer(sticky, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors)


@api_view(['DELETE'])
def delete_sticky(request, pk):
    sticky = get_object_or_404(Sticky, pk=pk)
    sticky.delete()
    return Response({'detail': 'Sticky deleted'})

@api_view(['POST'])
def add_checklist_item(request, sticky_id):
    sticky = get_object_or_404(Sticky, pk=sticky_id)
    serializer = ChecklistItemSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(sticky=sticky)
        return Response(serializer.data)
    return Response(serializer.errors)

@api_view(['PATCH'])
def update_checklist_item(request, sticky_id, item_id):
    item = get_object_or_404(ChecklistItem, pk=item_id, sticky__id=sticky_id)
    serializer = ChecklistItemSerializer(item, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors)

@api_view(['DELETE'])
def delete_checklist_item(request, sticky_id, item_id):
    item = get_object_or_404(ChecklistItem, pk=item_id, sticky__id=sticky_id)
    item.delete()
    return Response({'detail': 'Checklist item deleted'})
