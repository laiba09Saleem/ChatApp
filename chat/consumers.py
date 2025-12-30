import json
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
        else:
            await self.close()

    async def disconnect(self, close_code):
        if self.user.is_authenticated:
            # Leave room group
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
            
            # Update user online status
            await self.update_user_status(False)

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_type = text_data_json.get('type', 'chat_message')
        
        if message_type == 'chat_message':
            content = text_data_json['content']
            message = await self.save_message(content)
            
            # Send message to room group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': message,
                    'sender': self.user.username
                }
            )
            
            # Check if AI response is needed
            await self.check_ai_response(content, message['id'])
            
        elif message_type == 'typing':
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'typing_indicator',
                    'user': self.user.username,
                    'is_typing': text_data_json['is_typing']
                }
            )

    async def chat_message(self, event):
        message = event['message']
        
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': message,
            'sender': event['sender']
        }))

    async def typing_indicator(self, event):
        await self.send(text_data=json.dumps({
            'type': 'typing',
            'user': event['user'],
            'is_typing': event['is_typing']
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
            'timestamp': message.timestamp.isoformat(),
            'sender': {
                'id': message.sender.id,
                'username': message.sender.username
            }
        }

    @database_sync_to_async
    def update_user_status(self, is_online):
        self.user.online_status = is_online
        self.user.save()

    async def check_ai_response(self, user_message, message_id):
        # Check if AI should respond
        conversation = await self.get_conversation()
        
        if conversation.is_group and await self.has_ai_participant():
            ai_response = await self.generate_ai_response(user_message)
            
            if ai_response:
                # Save and send AI response
                message = await self.save_ai_message(ai_response)
                
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'chat_message',
                        'message': message,
                        'sender': 'AI Assistant'
                    }
                )

    @database_sync_to_async
    def get_conversation(self):
        return Conversation.objects.get(id=self.conversation_id)

    @database_sync_to_async
    def has_ai_participant(self):
        # Check if AI is a participant in the conversation
        return self.conversation.ai_assistants.exists()

    async def generate_ai_response(self, user_message):
        # Generate AI response using OpenAI
        try:
            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant in a chat application."},
                    {"role": "user", "content": user_message}
                ],
                max_tokens=500
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"AI Error: {e}")
            return None

    @database_sync_to_async
    def save_ai_message(self, content):
        conversation = Conversation.objects.get(id=self.conversation_id)
        ai_user = User.objects.get(username='ai_assistant')
        
        message = Message.objects.create(
            conversation=conversation,
            sender=ai_user,
            content=content,
            message_type='text'
        )
        
        return {
            'id': str(message.id),
            'content': message.content,
            'timestamp': message.timestamp.isoformat(),
            'sender': {
                'id': message.sender.id,
                'username': 'AI Assistant'
            }
        }