from django.urls import path
from .views import EventIngestView, IssueListView

urlpatterns = [
    path('events/', EventIngestView.as_view(), name='event-ingest'),
    path('projects/<int:project_id>/issues/', IssueListView.as_view(), name='issue-list'),
]