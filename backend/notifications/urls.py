# notifications/urls.py

from django.urls import path
from . import views

urlpatterns = [
    path("create/", views.create_notification, name="create-notification"),
    path("<int:pk>/", views.get_notification, name="get-notification"),
    path("user/<str:user_id>/", views.get_all_notifications, name="get-all-notifications"),
    path("<int:pk>/read/", views.read_notification, name="read-notification"),
    path("<int:pk>/unread/", views.unread_notification, name="unread-notification"),
    path("<int:pk>/delete/", views.delete_notification, name="delete-notification"),
    path("user/<str:user_id>/delete-all/", views.delete_all_notifications, name="delete-all-notifications"),
    path("user/<str:user_id>/read-all/", views.read_all_notifications, name="read-all-notifications"),
]
