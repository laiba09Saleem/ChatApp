from django.core.management.base import BaseCommand
from accounts.models import CustomUser

class Command(BaseCommand):
    help = 'Create AI assistant user'

    def handle(self, *args, **kwargs):
        ai_user, created = CustomUser.objects.get_or_create(
            username='ai_assistant',
            defaults={
                'email': 'ai@chat.com',
                'first_name': 'AI',
                'last_name': 'Assistant',
                'is_active': True,
                'is_staff': False,
                'is_superuser': False
            }
        )
        
        if created:
            ai_user.set_password('ai_password_123')  # Change in production
            ai_user.save()
            self.stdout.write(self.style.SUCCESS('AI assistant user created'))
        else:
            self.stdout.write(self.style.WARNING('AI assistant user already exists'))