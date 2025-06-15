from django.urls import path
from .views import ClerkWebhookView
from .views import api_get_user
from .views import get_user_profile
from . import views

urlpatterns = [
    path('service/', ClerkWebhookView.as_view(), name='clerk-webhook'),
    path("api/<str:user_id>/", api_get_user, name="api_get_user"),
    path('', views.api_get_users, name="get-user"),
    path('<str:user_id>/update/', views.api_update_user, name="update-user"),
    path('<str:user_id>/delete/', views.api_delete_user, name="delete-user"),
    path('<str:user_id>/role/', views.api_update_user_role, name="update-user-role"),
    path('create/', views.api_create_user, name="create-user"),
    path('users/<str:user_id>/', get_user_profile, name='get_user_profile'),
]
