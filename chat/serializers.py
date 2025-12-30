from rest_framework import serializers
from .models import Conversation, Message, UserSettings
from accounts.serializers import UserSerializer

class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    read_by_users = serializers.SerializerMethodField()
    
    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender', 'content', 
                  'message_type', 'file', 'timestamp', 'read_by', 'read_by_users']
        read_only_fields = ['id', 'timestamp', 'sender']
    
    def get_read_by_users(self, obj):
        return UserSerializer(obj.read_by.all(), many=True).data
    
    def create(self, validated_data):
        validated_data['sender'] = self.context['request'].user
        return super().create(validated_data)

class ConversationSerializer(serializers.ModelSerializer):
    participants = UserSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = ['id', 'name', 'participants', 'is_group', 'ai_enabled',
                  'created_at', 'updated_at', 'last_message', 'unread_count']
    
    def get_last_message(self, obj):
        last_msg = obj.messages.last()
        if last_msg:
            return {
                'id': last_msg.id,
                'content': last_msg.content[:100],
                'sender': last_msg.sender.username,
                'timestamp': last_msg.timestamp,
                'message_type': last_msg.message_type
            }
        return None
    
    def get_unread_count(self, obj):
        user = self.context['request'].user
        return obj.messages.exclude(read_by=user).count()

class CreateConversationSerializer(serializers.Serializer):
    participant_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1
    )
    name = serializers.CharField(required=False, allow_blank=True)
    is_group = serializers.BooleanField(default=False)

class MarkAsReadSerializer(serializers.Serializer):
    message_ids = serializers.ListField(
        child=serializers.UUIDField()
    )

class UserSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSettings
        fields = ['theme', 'notifications_enabled', 'sound_enabled']