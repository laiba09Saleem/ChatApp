from django.contrib.auth.models import AbstractUser
from django.db import models
import os

def profile_picture_path(instance, filename):
    # File will be uploaded to MEDIA_ROOT/profile_pics/user_<id>/<filename>
    ext = filename.split('.')[-1]
    filename = f"profile_{instance.id}.{ext}"
    return os.path.join('profile_pics', f"user_{instance.id}", filename)

class CustomUser(AbstractUser):
    profile_picture = models.ImageField(
        upload_to=profile_picture_path, 
        null=True, 
        blank=True,
        default='profile_pics/default.png'
    )
    online_status = models.BooleanField(default=False)
    last_seen = models.DateTimeField(auto_now=True)
    
    # Additional fields for chat app
    bio = models.TextField(max_length=500, blank=True)
    phone_number = models.CharField(max_length=20, blank=True)
    is_online = models.BooleanField(default=False)
    
    def __str__(self):
        return self.username
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()
    
    class Meta:
        ordering = ['-date_joined']