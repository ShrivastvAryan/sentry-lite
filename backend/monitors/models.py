from django.db import models
from projects.models import Project


class Monitor(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='monitors')
    name = models.CharField(max_length=255)
    url = models.URLField()
    interval_seconds = models.PositiveIntegerField(default=300)  # 5 min default
    expected_status = models.PositiveIntegerField(default=200)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    current_status = models.CharField(
        max_length=10,
        choices=[('up', 'Up'), ('down', 'Down'), ('unknown', 'Unknown')],
        default='unknown',
    )

    def __str__(self):
        return f"{self.name} ({self.url})"


class Ping(models.Model):
    monitor = models.ForeignKey(Monitor, on_delete=models.CASCADE, related_name='pings')
    status_code = models.IntegerField(null=True, blank=True)
    response_time_ms = models.IntegerField(null=True, blank=True)
    is_up = models.BooleanField(default=False)
    checked_at = models.DateTimeField(auto_now_add=True)
    error_message = models.TextField(null=True, blank=True)

    class Meta:
        ordering = ['-checked_at']

    def __str__(self):
        return f"{self.monitor.name} - {'UP' if self.is_up else 'DOWN'} @ {self.checked_at}"

class AlertChannel(models.Model):
    CHANNEL_TYPES = [
        ('email', 'Email'),
        ('webhook', 'Webhook'),
    ]

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='alert_channels')
    channel_type = models.CharField(max_length=20, choices=CHANNEL_TYPES)
    target = models.CharField(max_length=500)  # email address or webhook URL
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.channel_type}: {self.target}"