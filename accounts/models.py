from django.contrib.auth.models import AbstractUser
from django.db import models
import os

def profile_picture_path(instance, filename):
    ext = filename.split('.')[-1]
    filename = f"profile_{instance.id}_{int(instance.date_joined.timestamp())}.{ext}"
    return os.path.join('profile_pics', f"user_{instance.id}", filename)

class CustomUser(AbstractUser):
    profile_picture = models.ImageField(
        upload_to=profile_picture_path, 
        null=True, 
        blank=True,
        default='profile_pics/default.png'
    )
    bio = models.TextField(max_length=500, blank=True)
    phone_number = models.CharField(max_length=20, blank=True)
    is_online = models.BooleanField(default=False)
    last_seen = models.DateTimeField(auto_now=True)
    
    # Theme preference
    THEME_CHOICES = [
        ('light', 'Light'),
        ('dark', 'Dark'),
        ('auto', 'Auto'),
    ]
    theme = models.CharField(max_length=10, choices=THEME_CHOICES, default='auto')
    
    def __str__(self):
        return self.username
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()
    
    @property
    def initials(self):
        if self.first_name and self.last_name:
            return f"{self.first_name[0]}{self.last_name[0]}".upper()
        elif self.username:
            return self.username[:2].upper()
        return "U"
    
    def save(self, *args, **kwargs):
        # Ensure email is lowercase
        if self.email:
            self.email = self.email.lower()
        super().save(*args, **kwargs)
    
    class Meta:
        ordering = ['-date_joined']
        verbose_name = 'User'
        verbose_name_plural = 'Users'