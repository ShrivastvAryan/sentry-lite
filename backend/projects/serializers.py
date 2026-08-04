from rest_framework import serializers
from .models import Project

class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ['id', 'name', 'api_key', 'created_at']
        read_only_fields = ['api_key', 'created_at']