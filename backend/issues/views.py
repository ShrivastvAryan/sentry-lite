import hashlib
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status,generics, permissions
from projects.models import Project
from .models import Event, Issue
from .serializers import EventIngestSerializer, IssueSerializer


def make_fingerprint(message, stack_trace):
    frames = stack_trace[:3] if stack_trace else []
    raw = message + ''.join(str(f) for f in frames)
    return hashlib.sha256(raw.encode()).hexdigest()

class IssueListView(generics.ListAPIView):
    serializer_class = IssueSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        project_id = self.kwargs['project_id']
        return Issue.objects.filter(
            project_id=project_id,
            project__owner=self.request.user
        ).order_by('-last_seen')


class EventIngestView(APIView):
    def post(self, request):
        api_key = request.headers.get('X-API-Key')
        if not api_key:
            return Response({'error': 'Missing API key'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            project = Project.objects.get(api_key=api_key)
        except Project.DoesNotExist:
            return Response({'error': 'Invalid API key'}, status=status.HTTP_401_UNAUTHORIZED)

        serializer = EventIngestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        message = serializer.validated_data['message']
        stack_trace = serializer.validated_data.get('stack_trace')
        fingerprint = make_fingerprint(message, stack_trace)

        issue, created = Issue.objects.get_or_create(
            project=project,
            fingerprint=fingerprint,
            defaults={'title': message[:255]},
        )
        if not created:
            issue.count += 1
            issue.save()

        Event.objects.create(
            project=project,
            issue=issue,
            message=message,
            stack_trace=stack_trace,
        )

        return Response({'status': 'ok', 'issue_id': issue.id}, status=status.HTTP_201_CREATED)