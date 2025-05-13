from django.urls import path
from .views import ClerkWebhookView
from .views import api_get_user

urlpatterns = [
    path('service/', ClerkWebhookView.as_view(), name='clerk-webhook'),
    path("api/<str:user_id>/", api_get_user, name="api_get_user"),
]
