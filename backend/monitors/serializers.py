from rest_framework import serializers
from .models import Monitor

class MonitorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Monitor
        fields = ['id', 'name', 'url', 'interval_seconds', 'expected_status', 'is_active', 'current_status']