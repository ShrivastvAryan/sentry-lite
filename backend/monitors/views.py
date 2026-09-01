from rest_framework import generics, permissions
from .models import Monitor
from .serializers import MonitorSerializer

class MonitorListView(generics.ListAPIView):
    serializer_class = MonitorSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        project_id = self.kwargs['project_id']
        return Monitor.objects.filter(
            project_id=project_id,
            project__owner=self.request.user
        )