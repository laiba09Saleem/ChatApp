from django.db import models
from django.conf import settings
import uuid

class Conversation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, blank=True)
    participants = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='conversations')
    is_group = models.BooleanField(default=False)
    ai_enabled = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-updated_at']
    
    def __str__(self):
        return self.name or f"Conversation {self.id}"
    
    @property
    def is_direct_chat(self):
        return not self.is_group and self.participants.count() == 2

class Message(models.Model):
    MESSAGE_TYPES = [
        ('text', 'Text'),
        ('image', 'Image'),
        ('file', 'File'),
        ('audio', 'Audio'),
        ('video', 'Video'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content = models.TextField()
    message_type = models.CharField(max_length=10, choices=MESSAGE_TYPES, default='text')
    file = models.FileField(upload_to='chat_files/%Y/%m/%d/', null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    read_by = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='read_messages', blank=True)
    
    class Meta:
        ordering = ['timestamp']
    
    def __str__(self):
        return f"{self.sender.username}: {self.content[:50]}"
    
    @property
    def is_read(self):
        return self.read_by.count() > 0