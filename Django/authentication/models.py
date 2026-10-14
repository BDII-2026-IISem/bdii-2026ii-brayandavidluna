from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    phone = models.CharField(max_length=20, blank=True, null=True)
    document_number = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self):
        return f"{self.username} ({self.email})"