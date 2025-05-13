# urls.py
from django.urls import path
from .views import get_archived_projects

urlpatterns = [
    path('api/archives/', get_archived_projects),
]
