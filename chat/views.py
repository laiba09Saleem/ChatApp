from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q, Count, Max
from django.shortcuts import get_object_or_404, render
from django.contrib.auth.decorators import login_required
from django.utils import timezone

from accounts.serializers import UserSerializer
from .models import Conversation, Message, UserSettings
from .serializers import (
    ConversationSerializer, MessageSerializer, 
    CreateConversationSerializer, MarkAsReadSerializer,
    UserSettingsSerializer
)
from accounts.models import CustomUser
import openai
from datetime import datetime, timedelta

class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'participants__username', 'participants__email']
    ordering_fields = ['updated_at', 'created_at']
    
    def get_queryset(self):
        user = self.request.user
        return Conversation.objects.filter(participants=user)\
            .annotate(
                last_message_time=Max('messages__timestamp')
            )\
            .order_by('-last_message_time', '-updated_at')
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def create(self, request):
        serializer = CreateConversationSerializer(data=request.data)
        if serializer.is_valid():
            participant_ids = serializer.validated_data['participant_ids']
            is_group = serializer.validated_data['is_group']
            name = serializer.validated_data.get('name', '')
            
            # Get participants
            participants = CustomUser.objects.filter(id__in=participant_ids)
            
            # Check if conversation already exists (for 1-on-1 chats)
            if not is_group and len(participant_ids) == 1:
                existing_conversation = Conversation.objects.filter(
                    participants=request.user,
                    is_group=False
                ).filter(
                    participants__in=participant_ids
                ).annotate(
                    participant_count=Count('participants')
                ).filter(
                    participant_count=2
                ).first()
                
                if existing_conversation:
                    return Response(
                        ConversationSerializer(existing_conversation, context={'request': request}).data,
                        status=status.HTTP_200_OK
                    )
            
            # Create new conversation
            conversation = Conversation.objects.create(
                name=name,
                is_group=is_group,
                ai_enabled=is_group  # Enable AI by default for groups
            )
            
            # Add participants
            conversation.participants.add(request.user)
            for participant in participants:
                conversation.participants.add(participant)
            
            return Response(
                ConversationSerializer(conversation, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def toggle_ai(self, request, pk=None):
        conversation = self.get_object()
        enabled = request.data.get('enabled', False)
        
        conversation.ai_enabled = enabled
        conversation.save()
        
        return Response({
            'status': 'success',
            'ai_enabled': enabled
        })
    
    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        conversation = self.get_object()
        
        # Mark messages as read
        unread_messages = conversation.messages.exclude(read_by=request.user)
        for message in unread_messages:
            message.read_by.add(request.user)
        
        messages = conversation.messages.all().order_by('timestamp')
        page = self.paginate_queryset(messages)
        
        if page is not None:
            serializer = MessageSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        
        serializer = MessageSerializer(messages, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def ai_suggestions(self, request, pk=None):
        message = request.data.get('message')
        
        if not message:
            return Response(
                {'error': 'Message is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            import openai
            from core.settings import OPENAI_API_KEY
            
            if not OPENAI_API_KEY:
                return Response(
                    {'error': 'OpenAI API key not configured'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            openai.api_key = OPENAI_API_KEY
            
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that suggests chat replies. Provide 3-5 short, friendly reply suggestions as a bullet list."},
                    {"role": "user", "content": f"Suggest replies for: '{message}'"}
                ],
                max_tokens=100,
                temperature=0.7
            )
            
            suggestions_text = response.choices[0].message.content
            suggestions = [s.strip('-• ') for s in suggestions_text.split('\n') if s.strip()]
            
            return Response({'suggestions': suggestions})
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        conversation_id = self.request.query_params.get('conversation')
        
        queryset = Message.objects.filter(
            conversation__participants=user
        )
        
        if conversation_id:
            queryset = queryset.filter(conversation_id=conversation_id)
        
        return queryset.order_by('timestamp')
    
    def perform_create(self, serializer):
        message = serializer.save()
        # Add sender to read_by
        message.read_by.add(self.request.user)
        
        # Update conversation's updated_at
        message.conversation.updated_at = timezone.now()
        message.conversation.save()
    
    @action(detail=False, methods=['post'])
    def mark_as_read(self, request):
        serializer = MarkAsReadSerializer(data=request.data)
        if serializer.is_valid():
            message_ids = serializer.validated_data['message_ids']
            messages = Message.objects.filter(
                id__in=message_ids,
                conversation__participants=request.user
            )
            
            for message in messages:
                message.read_by.add(request.user)
            
            return Response({'status': 'messages marked as read'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        count = Message.objects.filter(
            conversation__participants=request.user
        ).exclude(
            read_by=request.user
        ).count()
        
        return Response({'unread_count': count})

class UserSettingsViewSet(viewsets.ModelViewSet):
    serializer_class = UserSettingsSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return UserSettings.objects.filter(user=self.request.user)
    
    def get_object(self):
        obj, created = UserSettings.objects.get_or_create(user=self.request.user)
        return obj

class SearchMessagesView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        query = request.query_params.get('q', '')
        conversation_id = request.query_params.get('conversation_id')
        
        if not query:
            return Response(
                {'error': 'Search query is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        messages = Message.objects.filter(
            conversation__participants=request.user,
            content__icontains=query
        )
        
        if conversation_id:
            messages = messages.filter(conversation_id=conversation_id)
        
        messages = messages.order_by('-timestamp')
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)

class RecentContactsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        # Get users you've recently messaged with
        recent_messages = Message.objects.filter(
            Q(conversation__participants=request.user) &
            ~Q(sender=request.user)
        ).order_by('-timestamp').values('sender').distinct()[:10]
        
        user_ids = [msg['sender'] for msg in recent_messages]
        users = CustomUser.objects.filter(id__in=user_ids)
        serializer = UserSerializer(users, many=True)
        
        return Response(serializer.data)

@login_required
def chat_home(request):
    """Render the main chat interface"""
    context = {
        'user': request.user,
        'theme': request.user.theme
    }
    return render(request, 'chat/index.html', context)

def home(request):
    """Landing page for non-authenticated users"""
    if request.user.is_authenticated:
        return chat_home(request)
    return render(request, 'home.html')