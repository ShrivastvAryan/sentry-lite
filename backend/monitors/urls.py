from django.urls import path
from .views import MonitorListView

urlpatterns = [
    path('projects/<int:project_id>/monitors/', MonitorListView.as_view(), name='monitor-list'),
]