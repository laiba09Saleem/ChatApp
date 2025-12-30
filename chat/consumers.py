import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import Conversation, Message
import openai

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        self.room_group_name = f'chat_{self.conversation_id}'
        
        if self.user.is_authenticated:
            # Join room group
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            
            await self.accept()
            
            # Update user online status
            await self.update_user_status(True)
            
            # Notify others about user joining
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_status',
                    'user_id': self.user.id,
                    'username': self.user.username,
                    'status': 'online'
                }
            )
        else:
            await self.close(code=4001)

    async def disconnect(self, close_code):
        if hasattr(self, 'user') and self.user.is_authenticated:
            # Leave room group
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
            
            # Update user online status
            await self.update_user_status(False)
            
            # Notify others about user leaving
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_status',
                    'user_id': self.user.id,
                    'username': self.user.username,
                    'status': 'offline'
                }
            )

    async def receive(self, text_data):
        try:
            text_data_json = json.loads(text_data)
            message_type = text_data_json.get('type', 'chat_message')
            
            if message_type == 'chat_message':
                content = text_data_json.get('content', '').strip()
                if content:
                    message = await self.save_message(content)
                    
                    # Send message to room group
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'chat_message',
                            'message': message,
                            'sender_id': self.user.id,
                            'sender_username': self.user.username
                        }
                    )
                    
                    # Check for AI response
                    await self.check_ai_response(content, message['id'])
                    
            elif message_type == 'typing':
                is_typing = text_data_json.get('is_typing', False)
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'typing_indicator',
                        'user_id': self.user.id,
                        'username': self.user.username,
                        'is_typing': is_typing
                    }
                )
                
            elif message_type == 'read_receipt':
                message_id = text_data_json.get('message_id')
                if message_id:
                    await self.mark_as_read(message_id)
                    
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'error': 'Invalid JSON format'
            }))
        except Exception as e:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'error': str(e)
            }))

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': event['message'],
            'sender': {
                'id': event['sender_id'],
                'username': event['sender_username']
            }
        }))

    async def typing_indicator(self, event):
        await self.send(text_data=json.dumps({
            'type': 'typing',
            'user': {
                'id': event['user_id'],
                'username': event['username']
            },
            'is_typing': event['is_typing']
        }))

    async def user_status(self, event):
        await self.send(text_data=json.dumps({
            'type': 'user_status',
            'user': {
                'id': event['user_id'],
                'username': event['username']
            },
            'status': event['status']
        }))

    @database_sync_to_async
    def save_message(self, content):
        conversation = Conversation.objects.get(id=self.conversation_id)
        message = Message.objects.create(
            conversation=conversation,
            sender=self.user,
            content=content,
            message_type='text'
        )
        
        return {
            'id': str(message.id),
            'content': message.content,
            'message_type': message.message_type,
            'timestamp': message.timestamp.isoformat(),
            'sender': {
                'id': message.sender.id,
                'username': message.sender.username
            }
        }

    @database_sync_to_async
    def update_user_status(self, is_online):
        self.user.is_online = is_online
        self.user.save()

    @database_sync_to_async
    def mark_as_read(self, message_id):
        try:
            message = Message.objects.get(id=message_id)
            if self.user not in message.read_by.all():
                message.read_by.add(self.user)
        except Message.DoesNotExist:
            pass

    async def check_ai_response(self, user_message, message_id):
        # Check if conversation has AI enabled
        conversation = await self.get_conversation()
        
        if conversation.ai_enabled:
            # Generate AI response
            ai_response = await self.generate_ai_response(user_message)
            
            if ai_response:
                # Save and send AI response
                message = await self.save_ai_message(ai_response)
                
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'chat_message',
                        'message': message,
                        'sender_id': 0,  # AI user ID
                        'sender_username': 'AI Assistant'
                    }
                )

    @database_sync_to_async
    def get_conversation(self):
        return Conversation.objects.get(id=self.conversation_id)

    async def generate_ai_response(self, user_message):
        try:
            from core.settings import OPENAI_API_KEY
            if not OPENAI_API_KEY:
                return None
                
            import openai
            openai.api_key = OPENAI_API_KEY
            
            response = await asyncio.to_thread(
                openai.ChatCompletion.create,
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant in a chat application. Keep responses concise and friendly."},
                    {"role": "user", "content": user_message}
                ],
                max_tokens=150,
                temperature=0.7
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"AI Error: {e}")
            return None

    @database_sync_to_async
    def save_ai_message(self, content):
        conversation = Conversation.objects.get(id=self.conversation_id)
        
        # Get or create AI user
        ai_user, created = User.objects.get_or_create(
            username='ai_assistant',
            defaults={
                'email': 'ai@chat.com',
                'first_name': 'AI',
                'last_name': 'Assistant',
                'is_active': True,
                'is_staff': False
            }
        )
        
        message = Message.objects.create(
            conversation=conversation,
            sender=ai_user,
            content=content,
            message_type='text'
        )
        
        return {
            'id': str(message.id),
            'content': message.content,
            'message_type': message.message_type,
            'timestamp': message.timestamp.isoformat(),
            'sender': {
                'id': ai_user.id,
                'username': 'AI Assistant'
            }
        }