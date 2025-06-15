from django.contrib import admin
from .models import Archive,Quicklink,Sticky,ChecklistItem

admin.site.register(Archive)
admin.site.register(Quicklink)
admin.site.register(Sticky)
admin.site.register(ChecklistItem)