from django.db import models
from projects.models import Project


class Issue(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='issues')
    fingerprint = models.CharField(max_length=64)
    title = models.CharField(max_length=255)
    count = models.PositiveIntegerField(default=1)
    last_seen = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('project', 'fingerprint')

    def __str__(self):
        return f"{self.title} ({self.count})"


class Event(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='events')
    issue = models.ForeignKey(Issue, on_delete=models.CASCADE, related_name='events', null=True, blank=True)
    message = models.TextField()
    stack_trace = models.JSONField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.message[:50]