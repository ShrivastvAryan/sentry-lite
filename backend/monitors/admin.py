from django.contrib import admin
from .models import Monitor, Ping, AlertChannel

@admin.register(Monitor)
class MonitorAdmin(admin.ModelAdmin):
    list_display = ('name', 'url', 'project', 'current_status', 'is_active')

@admin.register(Ping)
class PingAdmin(admin.ModelAdmin):
    list_display = ('monitor', 'is_up', 'status_code', 'response_time_ms', 'checked_at')

@admin.register(AlertChannel)
class AlertChannelAdmin(admin.ModelAdmin):
    list_display = ('project', 'channel_type', 'target', 'is_active')