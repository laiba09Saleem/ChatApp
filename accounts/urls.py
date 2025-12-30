from django.urls import path
from . import views

urlpatterns = [
    # Authentication
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    
    # User profiles
    path('profile/', views.UserProfileView.as_view(), name='profile'),
    path('me/', views.get_current_user, name='current_user'),
    path('set-theme/', views.SetThemeView.as_view(), name='set_theme'),
    path('update-status/', views.UpdateOnlineStatusView.as_view(), name='update_status'),
    
    # User management
    path('users/', views.UserListView.as_view(), name='user_list'),
    path('users/<int:pk>/', views.UserDetailView.as_view(), name='user_detail'),
]