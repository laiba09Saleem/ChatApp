from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'conversations', views.ConversationViewSet, basename='conversation')
router.register(r'messages', views.MessageViewSet, basename='message')

urlpatterns = [
    path('', include(router.urls)),
    path('search-users/', views.SearchUsersView.as_view(), name='search_users'),
    path('recent-contacts/', views.RecentContactsView.as_view(), name='recent_contacts'),
    path('search-messages/', views.SearchMessagesView.as_view(), name='search_messages'),
    path('ai-suggestions/', views.AISuggestionsView.as_view(), name='ai_suggestions'),
]