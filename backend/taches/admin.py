from django.contrib import admin
from .models import Task,TaskToView,TaskHistory,Comment

# Register your models here.

admin.site.register(Task)
admin.site.register(TaskToView)
admin.site.register(TaskHistory)
admin.site.register(Comment)