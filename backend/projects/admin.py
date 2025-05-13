from django.contrib import admin
from .models import Project,ProjectToIntegration,UsersToProjects,Invite,Sprint
# Register your models here.

admin.site.register(Project)
admin.site.register(ProjectToIntegration)
admin.site.register(UsersToProjects)
admin.site.register(Invite)
admin.site.register(Sprint)