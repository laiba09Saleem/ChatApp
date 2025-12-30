from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth import authenticate, login, logout
from django.shortcuts import get_object_or_404
from django.utils import timezone
from accounts.models import CustomUser
from accounts.serializers import (
    UserSerializer, UserProfileSerializer, 
    RegisterSerializer, LoginSerializer
)
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required

class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = authenticate(
                username=serializer.validated_data['username'],
                password=serializer.validated_data['password']
            )
            
            if user:
                login(request, user)
                token, created = Token.objects.get_or_create(user=user)
                
                # Update last seen
                user.last_seen = timezone.now()
                user.save()
                
                return Response({
                    'token': token.key,
                    'user': UserSerializer(user).data,
                    'theme': user.theme
                })
            return Response(
                {'error': 'Invalid credentials'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            request.user.auth_token.delete()
        except:
            pass
        
        # Update last seen and set offline
        request.user.is_online = False
        request.user.last_seen = timezone.now()
        request.user.save()
        
        logout(request)
        return Response({'message': 'Successfully logged out'})

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user

class SetThemeView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        theme = request.data.get('theme')
        
        if theme not in ['light', 'dark', 'auto']:
            return Response(
                {'error': 'Invalid theme value. Use: light, dark, or auto'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        request.user.theme = theme
        request.user.save()
        
        return Response({
            'message': 'Theme updated successfully',
            'theme': theme
        })

class UpdateOnlineStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        is_online = request.data.get('online', False)
        request.user.is_online = is_online
        request.user.last_seen = timezone.now()
        request.user.save()
        
        return Response({
            'status': 'success',
            'online': is_online,
            'last_seen': request.user.last_seen
        })

class UserListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = CustomUser.objects.all().exclude(id=self.request.user.id)
        
        # Search functionality
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                username__icontains=search
            ) | queryset.filter(
                email__icontains=search
            ) | queryset.filter(
                first_name__icontains=search
            ) | queryset.filter(
                last_name__icontains=search
            )
        
        return queryset

class UserDetailView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = CustomUser.objects.all()
    
    def get_object(self):
        user_id = self.kwargs.get('pk')
        return get_object_or_404(CustomUser, id=user_id)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_current_user(request):
    serializer = UserSerializer(request.user)
    return Response({
        **serializer.data,
        'theme': request.user.theme
    })

def home(request):
    """Landing page for non-authenticated users"""
    if request.user.is_authenticated:
        return redirect('chat_home')
    return render(request, 'home.html')