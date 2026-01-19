"""
User views with clean architecture.
"""
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import login, logout
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .models import User
from .serializers import (
    UserSerializer, 
    UserUpdateSerializer, 
    RegisterSerializer, 
    LoginSerializer,
    ChangePasswordSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer
)


class CurrentUserView(generics.RetrieveUpdateAPIView):
    """
    Get or update current authenticated user.
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserUpdateSerializer
        return UserSerializer


@csrf_exempt
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_view(request):
    """Register a new user."""
    from django.db import IntegrityError
    
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        try:
            user = serializer.save()
            token, created = Token.objects.get_or_create(user=user)
            
            return Response({
                'user': UserSerializer(user).data,
                'token': token.key
            }, status=status.HTTP_201_CREATED)
        except IntegrityError as e:
            error_msg = str(e)
            if 'cpf' in error_msg.lower():
                return Response({
                    'cpf': ['Este CPF já está cadastrado.']
                }, status=status.HTTP_400_BAD_REQUEST)
            elif 'email' in error_msg.lower():
                return Response({
                    'email': ['Este email já está cadastrado.']
                }, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({
                    'detail': 'Erro ao criar usuário. Verifique se os dados não estão duplicados.'
                }, status=status.HTTP_400_BAD_REQUEST)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@csrf_exempt
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    """Login user and return token."""
    serializer = LoginSerializer(data=request.data, context={'request': request})
    
    if serializer.is_valid():
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        login(request, user)
        
        return Response({
            'user': UserSerializer(user).data,
            'token': token.key
        }, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    """Logout user and delete token."""
    try:
        request.user.auth_token.delete()
    except:
        pass
    
    logout(request)
    return Response({'detail': 'Logout realizado com sucesso.'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_profile(request):
    """
    Get current user profile with all details.
    """
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password_view(request):
    """Change user password."""
    serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
    
    if serializer.is_valid():
        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        # Update token
        Token.objects.filter(user=user).delete()
        token = Token.objects.create(user=user)
        
        return Response({
            'detail': 'Senha alterada com sucesso.',
            'token': token.key
        }, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def password_reset_request_view(request):
    """Request password reset - sends email with token."""
    from django.conf import settings
    from django.contrib.auth.tokens import default_token_generator
    from django.utils.http import urlsafe_base64_encode
    from django.utils.encoding import force_bytes
    from apps.enrollments.email_service import send_password_reset_email
    
    serializer = PasswordResetRequestSerializer(data=request.data)
    
    if serializer.is_valid():
        email = serializer.validated_data['email']
        
        try:
            user = User.objects.get(email=email)
            
            # Generate token
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            
            # Create reset link
            frontend_url = getattr(settings, 'FRONTEND_URL', 'https://areamais.com.br')
            reset_link = f"{frontend_url}/reset-password/{uid}/{token}/"
            
            # Send email via Resend
            send_password_reset_email(user, reset_link)
            
            return Response({
                'detail': 'Email de recuperação enviado com sucesso. Verifique sua caixa de entrada.'
            }, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            # Don't reveal if user exists or not for security
            return Response({
                'detail': 'Se o email existir em nossa base, você receberá instruções para recuperação.'
            }, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def password_reset_confirm_view(request):
    """Confirm password reset with token."""
    from django.contrib.auth.tokens import default_token_generator
    from django.utils.http import urlsafe_base64_decode
    from django.utils.encoding import force_str
    
    serializer = PasswordResetConfirmSerializer(data=request.data)
    
    if serializer.is_valid():
        uid = request.data.get('uid')
        token = serializer.validated_data['token']
        new_password = serializer.validated_data['new_password']
        
        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
            
            # Verify token
            if not default_token_generator.check_token(user, token):
                return Response(
                    {'detail': 'Token inválido ou expirado.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Set new password
            user.set_password(new_password)
            user.save()
            
            # Invalidate all tokens
            Token.objects.filter(user=user).delete()
            
            return Response({
                'detail': 'Senha alterada com sucesso. Faça login com sua nova senha.'
            }, status=status.HTTP_200_OK)
            
        except (User.DoesNotExist, ValueError, TypeError):
            return Response(
                {'detail': 'Token inválido.'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
