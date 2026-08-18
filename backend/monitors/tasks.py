import time
import requests
from celery import shared_task
from .models import Monitor, Ping, AlertChannel
from django.core.mail import send_mail
from django.conf import settings

@shared_task
def ping_monitor(monitor_id):
    try:
        monitor = Monitor.objects.get(id=monitor_id, is_active=True)
    except Monitor.DoesNotExist:
        return

    start = time.monotonic()
    try:
        response = requests.get(monitor.url, timeout=10)
        elapsed_ms = int((time.monotonic() - start) * 1000)
        is_up = response.status_code == monitor.expected_status

        Ping.objects.create(
            monitor=monitor,
            status_code=response.status_code,
            response_time_ms=elapsed_ms,
            is_up=is_up,
        )
    except requests.RequestException as e:
        elapsed_ms = int((time.monotonic() - start) * 1000)
        Ping.objects.create(
            monitor=monitor,
            status_code=None,
            response_time_ms=elapsed_ms,
            is_up=False,
            error_message=str(e),
        )


@shared_task
def ping_all_active_monitors():
    for monitor in Monitor.objects.filter(is_active=True):
        ping_monitor.delay(monitor.id)

def send_alert(monitor, is_up):
    status_text = "UP" if is_up else "DOWN"
    subject = f"[SentryLite] {monitor.name} is {status_text}"
    message = f"Monitor '{monitor.name}' ({monitor.url}) changed status to {status_text}."

    channels = AlertChannel.objects.filter(project=monitor.project, is_active=True)

    for channel in channels:
        if channel.channel_type == 'email':
            try:
                send_mail(
                    subject,
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    [channel.target],
                    fail_silently=False,
                )
            except Exception as e:
                print(f"Failed to send email alert: {e}")

        elif channel.channel_type == 'webhook':
            try:
                requests.post(
                    channel.target,
                    json={
                        "monitor": monitor.name,
                        "url": monitor.url,
                        "status": status_text,
                    },
                    timeout=5,
                )
            except requests.RequestException as e:
                print(f"Failed to send webhook alert: {e}")


@shared_task
def ping_monitor(monitor_id):
    try:
        monitor = Monitor.objects.get(id=monitor_id, is_active=True)
    except Monitor.DoesNotExist:
        return

    start = time.monotonic()
    try:
        response = requests.get(monitor.url, timeout=10)
        elapsed_ms = int((time.monotonic() - start) * 1000)
        is_up = response.status_code == monitor.expected_status
        status_code = response.status_code
        error_message = None
    except requests.RequestException as e:
        elapsed_ms = int((time.monotonic() - start) * 1000)
        is_up = False
        status_code = None
        error_message = str(e)

    Ping.objects.create(
        monitor=monitor,
        status_code=status_code,
        response_time_ms=elapsed_ms,
        is_up=is_up,
        error_message=error_message,
    )

    new_status = 'up' if is_up else 'down'

    # Only alert on an actual state change, not every ping
    if monitor.current_status != new_status and monitor.current_status != 'unknown':
        send_alert(monitor, is_up)

    monitor.current_status = new_status
    monitor.save(update_fields=['current_status'])


@shared_task
def ping_all_active_monitors():
    for monitor in Monitor.objects.filter(is_active=True):
        ping_monitor.delay(monitor.id)