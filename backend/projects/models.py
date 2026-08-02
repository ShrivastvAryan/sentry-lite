import secrets
from django.db import models

class Project(models.Model):
    name = models.CharField(max_length=255)
    api_key = models.CharField(max_length=64, unique=True, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.api_key:
            self.api_key = secrets.token_hex(20)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name