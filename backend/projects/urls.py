from django.urls import path
from . import views

urlpatterns = [
    path('projects/user/<str:user_id>/', views.get_all_projects, name='get_all_projects'),
    path('projects/<int:project_id>/user/<str:user_id>/', views.get_project, name='get_project'),
    path('projects/<int:project_id>/update/', views.update_project, name='update_project'),
    path('projects/<int:project_id>/assignees/', views.get_assignees_for_project, name='get_assignees_for_project'),
    path('projects/<int:project_id>/users/', views.get_all_users_in_project, name='get_all_users_in_project'),
    path('projects/create/', views.create_project, name='create_project'),
    path("projects/add_user/", views.api_add_user_to_project, name="api_add_user_to_project"),
    path('invite/create', views.api_create_invite, name='api_create_invite'),
    path('invite/join', views.api_join_project, name='api_join_project'),
    path('sprints/<int:project_id>/', views.get_sprints, name='get_sprints'),
    path('sprints/<int:project_id>/current/', views.get_current_sprint, name='get_current_sprint'),
    path('sprints/<int:project_id>/update/', views.update_sprints, name='update_sprints'),
    path("sprint/auto/", views.auto_sprint_view, name="auto-sprint"),
    path("redis/project-data/", views.project_application_data, name="project_application_data"),
    path("permissions/check/", views.check_permissions, name="check_permissions"),
    path("projects/<int:project_id>/remove-user/", views.remove_user_from_project),
    path("projects/<int:project_id>/delete/", views.delete_project),
    path("projects/<int:project_id>/users/<str:user_id>/role/", views.edit_user_role),
    path("projects/<int:project_id>/current-sprint-graph/", views.current_sprint_graph),
    path("archives/", views.archived_projects),
    path("projects/<int:pk>/archive/", views.archive_project),
    path("projects/<int:pk>/unarchive/", views.unarchive_project),
    path('projects/', views.get_projects_report, name='get_projects_report'),
    path('api/<int:project_id>/user/<str:user_id>/', views.update_user_skills),

]
