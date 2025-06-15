from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics, status
from .models import User
from .serializers import ClerkWebhookSerializer, UserProfileSerializer
import logging
# users/views.py

from rest_framework.decorators import api_view

from rest_framework.decorators import permission_classes
from rest_framework.permissions import IsAuthenticated

from django.core.cache import cache


from users.serializers import UserSerializer

@api_view(['GET'])
def get_user_profile(request, user_id):
    try:
        user = User.objects.get(pk=user_id)
        serializer = UserSerializer(user)
        return Response(serializer.data)
    except User.DoesNotExist:
        return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(["GET"])
def api_get_users(request):
    users = User.objects.all()
    data = [
        {
            "user_id": user.user_id,
            "username": user.username,
            "profilePicture": user.profilePicture or "",
            "role": user.role,
        }
        for user in users
    ]
    return Response(data)

@api_view(["GET"])
def api_get_user(request, user_id):
    try:
        user = User.objects.get(user_id=user_id)
        return Response({
            "user_id": user.user_id,
            "username": user.username,
            "profilePicture": user.profilePicture or "",
            "role": user.role,
        })
    except UserProfile.DoesNotExist:
        return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)

@api_view(["POST"])
def api_create_user(request):
    data = request.data
    user = User.objects.create(
        user_id=data["user_id"],
        username=data.get("username", ""),
        profilePicture=data.get("profilePicture", ""),
        role=data.get("role", "Membre"),
    )
    return Response({
        "user_id": user.user_id,
        "username": user.username,
        "profilePicture": user.profilePicture,
        "role": user.role,
    }, status=status.HTTP_201_CREATED)

@api_view(["PUT"])
def api_update_user(request, user_id):
    try:
        user = User.objects.get(user_id=user_id)
    except UserProfile.DoesNotExist:
        return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    data = request.data
    user.username = data.get("username", user.username)
    user.profilePicture = data.get("profilePicture", user.profilePicture)
    user.role = data.get("role", user.role)
    user.save()

    return Response({
        "user_id": user.user_id,
        "username": user.username,
        "profilePicture": user.profilePicture,
        "role": user.role,
    })

@api_view(["DELETE"])
def api_delete_user(request, user_id):
    try:
        user = User.objects.get(user_id=user_id)
        user.delete()
        return Response({"detail": "User deleted successfully"})
    except UserProfile.DoesNotExist:
        return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)

@api_view(["PATCH"])
def api_update_user_role(request, user_id):
    try:
        user = User.objects.get(user_id=user_id)
    except UserProfile.DoesNotExist:
        return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    new_role = request.data.get("role")
    if not new_role:
        return Response({"detail": "Role is required"}, status=status.HTTP_400_BAD_REQUEST)

    user.role = new_role
    user.save()

    return Response({
        "user_id": user.user_id,
        "username": user.username,
        "profilePicture": user.profilePicture,
        "role": user.role,
    })


@api_view(["GET"])
def api_get_user(request, user_id):
    try:
        user = User.objects.get(user_id=user_id)
        return Response({
            "userId": user.user_id,
            "username": user.username,
            "profilePicture": user.profilePicture,
            "role": user.role,
        })
    except User.DoesNotExist:
        return Response(
            {"detail": "User not found"},
            status=status.HTTP_404_NOT_FOUND,
        )


logger = logging.getLogger(__name__)

class ClerkWebhookView(APIView):
    def post(self, request, *args, **kwargs):
        serializer = ClerkWebhookSerializer(data=request.data)
        if serializer.is_valid():
            event_type = serializer.validated_data.get("type")
            data = serializer.validated_data.get("data")

            user_id = data.get("id")
            username = data.get("username")
            profile_picture = data.get("image_url")

            if not user_id:
                logger.error("No user ID found in event data.")
                return Response({"error": "Missing user ID."}, status=status.HTTP_400_BAD_REQUEST)

            if event_type == "user.created":
                User.objects.create(
                    user_id=user_id,
                    username=username,
                    profilePicture=profile_picture
                )
                logger.info(f"New user created: {user_id}")

            elif event_type == "user.updated":
                try:
                    user = User.objects.get(user_id=user_id)
                    user.username = username
                    user.profilePicture = profile_picture
                    user.save()
                    logger.info(f"User updated: {user_id}")
                except User.DoesNotExist:
                    logger.warning(f"User {user_id} not found for update.")

            elif event_type == "user.deleted":
                deleted_count, _ = User.objects.filter(user_id=user_id).delete()
                if deleted_count:
                    logger.info(f"User deleted: {user_id}")
                else:
                    logger.warning(f"User {user_id} not found for deletion.")

            else:
                logger.warning(f"Unhandled event type: {event_type}")

            return Response({"status": "success"}, status=status.HTTP_200_OK)
        
        logger.error(f"Invalid webhook payload: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(["GET"])
def get_user(request, user_id):
    user = get_object_or_404(User, id=user_id)
    serializer = UserSerializer(user)
    return Response(serializer.data)
