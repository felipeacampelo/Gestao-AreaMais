"""
Test email endpoint to verify email configuration.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from django.core.mail import send_mail
from django.conf import settings


@api_view(['POST'])
@permission_classes([IsAdminUser])
def test_email(request):
    """
    Test email configuration by sending a test email.
    
    POST /api/users/test-email/
    {
        "to_email": "recipient@example.com"
    }
    """
    to_email = request.data.get('to_email')
    
    if not to_email:
        return Response(
            {'error': 'to_email is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Show current email configuration
        config_info = {
            'EMAIL_BACKEND': settings.EMAIL_BACKEND,
            'EMAIL_HOST': settings.EMAIL_HOST,
            'EMAIL_PORT': settings.EMAIL_PORT,
            'EMAIL_USE_TLS': settings.EMAIL_USE_TLS,
            'EMAIL_HOST_USER': settings.EMAIL_HOST_USER,
            'DEFAULT_FROM_EMAIL': settings.DEFAULT_FROM_EMAIL,
        }
        
        # Try to send test email
        send_mail(
            subject='Test Email - AreaMais',
            message='This is a test email to verify email configuration.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[to_email],
            fail_silently=False,
        )
        
        return Response({
            'success': True,
            'message': f'Test email sent successfully to {to_email}',
            'config': config_info
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e),
            'config': config_info
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def email_config(request):
    """
    Show current email configuration (without sensitive data).
    
    GET /api/users/email-config/
    """
    return Response({
        'EMAIL_BACKEND': settings.EMAIL_BACKEND,
        'EMAIL_HOST': settings.EMAIL_HOST,
        'EMAIL_PORT': settings.EMAIL_PORT,
        'EMAIL_USE_TLS': settings.EMAIL_USE_TLS,
        'EMAIL_HOST_USER': settings.EMAIL_HOST_USER,
        'EMAIL_HOST_PASSWORD': '***' if settings.EMAIL_HOST_PASSWORD else 'NOT SET',
        'DEFAULT_FROM_EMAIL': settings.DEFAULT_FROM_EMAIL,
    })
