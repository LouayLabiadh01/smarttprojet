from django.urls import path
from . import views

urlpatterns = [
    path("create/", views.create_task, name="create_task"),
    path("project/<int:project_id>/", views.get_tasks_from_project, name="get_tasks_from_project"),
    path("project/<int:project_id>/active/", views.get_all_active_tasks_for_project, name="get_all_active_tasks_for_project"),
    path("<int:task_id>/", views.get_task, name="get_task"),
    path("<int:task_id>/update/", views.update_task, name="update_task"),
    path("<int:task_id>/activity/", views.get_task_activity, name="history_task"),
    path("<int:task_id>/delete/", views.delete_task, name="delete_task"),
    path("project/<int:project_id>/recent/", views.get_recent_tasks, name="get_recent_tasks"),
    path("sprints/project/<int:project_id>/", views.sprints_by_project, name="sprints_by_project"),
    path("tasks/project/<int:project_id>/sprint/<int:sprint_id>/", views.tasks_by_project_and_sprint, name="tasks_by_project_and_sprint"),
    path("task-history/by-task-ids/", views.task_history_by_task_ids, name="task_history_by_task_ids"),
    path("<int:task_id>/comments/", views.post_task_comment),
    path("comments/delete/<int:delete_id>/", views.delete_comment),
    path("<int:task_id>/history/", views.create_task_history),
    path('<int:task_id>/view/', views.update_or_insert_task_view, name='update_or_insert_task_view'),
]
