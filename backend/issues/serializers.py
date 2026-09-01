from rest_framework import serializers
from .models import Event, Issue


class EventIngestSerializer(serializers.Serializer):
    message = serializers.CharField()
    stack_trace = serializers.JSONField(required=False, allow_null=True)

class IssueSerializer(serializers.ModelSerializer):
    class Meta:
        model = Issue
        fields = ['id', 'title', 'fingerprint', 'count', 'last_seen', 'created_at']