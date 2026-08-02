from django.contrib import admin
from .models import Issue, Event

@admin.register(Issue)
class IssueAdmin(admin.ModelAdmin):
    list_display = ('title', 'project', 'count', 'last_seen')

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('message', 'project', 'issue', 'timestamp')