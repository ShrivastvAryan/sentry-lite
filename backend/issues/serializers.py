from rest_framework import serializers
from .models import Event


class EventIngestSerializer(serializers.Serializer):
    message = serializers.CharField()
    stack_trace = serializers.JSONField(required=False, allow_null=True)