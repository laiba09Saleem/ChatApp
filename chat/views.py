from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q, Count, Max
from django.shortcuts import get_object_or_404, render
from django.contrib.auth.decorators import login_required
from django.utils import timezone

from accounts.serializers import UserSerializer
from .models import Conversation, Message
from .serializers import (
    ConversationSerializer, MessageSerializer, 
    CreateConversationSerializer, MarkAsReadSerializer
)
from accounts.models import CustomUser

# Conversation ViewSet
class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        conversations = Conversation.objects.filter(participants=user)\
            .annotate(
                last_message_time=Max('messages__timestamp'),
                unread_count=Count('messages', filter=~Q(messages__read_by=user))
            )\
            .order_by('-last_message_time')
        
        return conversations
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def list(self, request):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def create_chat(self, request):
        serializer = CreateConversationSerializer(data=request.data)
        if serializer.is_valid():
            participant_ids = serializer.validated_data['participant_ids']
            is_group = serializer.validated_data['is_group']
            name = serializer.validated_data.get('name', '')
            
            # Get participants excluding current user
            participants = CustomUser.objects.filter(id__in=participant_ids).exclude(id=request.user.id)
            
            # Create conversation
            conversation = Conversation.objects.create(
                name=name,
                is_group=is_group,
                ai_enabled=is_group
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
    
    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        conversation = self.get_object()
        
        # Mark messages as read
        unread_messages = conversation.messages.exclude(read_by=request.user)
        for message in unread_messages:
            message.read_by.add(request.user)
        
        messages = conversation.messages.all().order_by('timestamp')
        serializer = MessageSerializer(messages, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        conversation = self.get_object()
        unread_messages = conversation.messages.exclude(read_by=request.user)
        
        for message in unread_messages:
            message.read_by.add(request.user)
        
        return Response({'status': 'conversation marked as read'})

# Message ViewSet
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

# Search Users View
class SearchUsersView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        query = request.query_params.get('q', '')
        
        users = CustomUser.objects.exclude(id=request.user.id)
        
        if query:
            users = users.filter(
                Q(username__icontains=query) |
                Q(email__icontains=query) |
                Q(first_name__icontains=query) |
                Q(last_name__icontains=query)
            )
        
        users = users[:20]  # Limit results
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

# Recent Contacts View
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

# Search Messages View
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

# AI Suggestions View
class AISuggestionsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        message = request.data.get('message')
        conversation_id = request.data.get('conversation_id')
        
        if not message:
            return Response(
                {'error': 'Message is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # For now, return mock suggestions
        # In production, integrate with OpenAI API
        suggestions = [
            "That's interesting!",
            "Can you tell me more?",
            "I agree with you",
            "What do you think about that?",
            "Let me know if you need help with anything else."
        ]
        
        return Response({'suggestions': suggestions})

# Template Views
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