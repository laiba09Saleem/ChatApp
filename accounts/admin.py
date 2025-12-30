from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser
from .forms import CustomUserCreationForm, CustomUserChangeForm

class CustomUserAdmin(UserAdmin):
    add_form = CustomUserCreationForm
    form = CustomUserChangeForm
    model = CustomUser
    list_display = ['username', 'email', 'first_name', 'last_name', 
                    'is_staff', 'is_online', 'last_seen']
    list_filter = ['is_staff', 'is_active', 'is_online', 'date_joined']
    fieldsets = UserAdmin.fieldsets + (
        (None, {'fields': ('profile_picture', 'bio', 'phone_number', 'is_online')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        (None, {'fields': ('profile_picture', 'bio', 'phone_number')}),
    )
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering = ['-date_joined']

admin.site.register(CustomUser, CustomUserAdmin)