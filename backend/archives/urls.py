# urls.py
from django.urls import path
from .views import get_archived_projects
from .views import get_quicklinks, create_quicklink, delete_quicklink
from .views import (
    get_stickies,
    create_sticky,
    update_sticky,
    delete_sticky,
    add_checklist_item,
    update_checklist_item,
    delete_checklist_item,
)

urlpatterns = [
    path('quicklinks/', get_quicklinks, name='get-quicklinks'),
    path('quicklinks/create/', create_quicklink, name='create-quicklink'),
    path('quicklinks/<uuid:pk>/', delete_quicklink, name='delete-quicklink'),

    path('stickies/', get_stickies),
    path('stickies/create/', create_sticky),
    path('stickies/<uuid:pk>/', update_sticky),
    path('stickies/<uuid:pk>/delete/', delete_sticky),

    path('stickies/<uuid:sticky_id>/items/', add_checklist_item),
    path('stickies/<uuid:sticky_id>/items/<uuid:item_id>/', update_checklist_item),
    path('stickies/<uuid:sticky_id>/items/<uuid:item_id>/delete/', delete_checklist_item),
]
