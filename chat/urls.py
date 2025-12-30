from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'conversations', views.ConversationViewSet, basename='conversation')
router.register(r'messages', views.MessageViewSet, basename='message')
router.register(r'settings', views.UserSettingsViewSet, basename='settings')

urlpatterns = [
    path('', include(router.urls)),
    path('search/', views.SearchMessagesView.as_view(), name='search_messages'),
    path('recent-contacts/', views.RecentContactsView.as_view(), name='recent_contacts'),
]