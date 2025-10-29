"""
Payment views.
"""
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.conf import settings
from .models import Payment
from .serializers import (
    PaymentSerializer,
    PaymentCreateSerializer,
    PaymentListSerializer
)
from .services import PaymentService


class PaymentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for payments.
    Users can create and view payments for their enrollments.
    """
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        """Return payments for current user's enrollments."""
        # Durante create, não precisamos do queryset
        if self.action == 'create':
            return Payment.objects.none()
        
        if self.request.user and self.request.user.is_authenticated:
            return Payment.objects.filter(
                enrollment__user=self.request.user
            ).select_related('enrollment', 'enrollment__product', 'enrollment__batch')
        return Payment.objects.all().select_related('enrollment', 'enrollment__product', 'enrollment__batch')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return PaymentCreateSerializer
        elif self.action == 'list':
            return PaymentListSerializer
        return PaymentSerializer
    
    def create(self, request, *args, **kwargs):
        """Create new payment."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payment = serializer.save()
        
        # Return full payment data
        response_serializer = PaymentSerializer(payment)
        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED
        )


@method_decorator(csrf_exempt, name='dispatch')
class AsaasWebhookView(APIView):
    """
    Webhook endpoint for Asaas payment notifications.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        """Process Asaas webhook."""
        import logging
        logger = logging.getLogger(__name__)
        
        # Log webhook received
        logger.info(f'Webhook received: {request.data}')
        print(f'[WEBHOOK] Received: {request.data}')
        
        # Validate webhook token (desabilitado para testes)
        # webhook_token = request.headers.get('asaas-access-token')
        # expected_token = settings.ASAAS_WEBHOOK_TOKEN
        # 
        # if expected_token and webhook_token != expected_token:
        #     return Response(
        #         {'detail': 'Invalid webhook token'},
        #         status=status.HTTP_401_UNAUTHORIZED
        #     )
        
        # Process webhook
        try:
            service = PaymentService()
            service.process_webhook(request.data)
            logger.info(f'Webhook processed successfully')
            print(f'[WEBHOOK] Processed successfully')
            return Response({'status': 'processed'}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f'Webhook error: {str(e)}')
            print(f'[WEBHOOK] Error: {str(e)}')
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def simulate_pix_payment(request):
    """
    Simulate PIX payment in sandbox using Asaas API.
    
    Expected payload:
    {
        "payment_id": "pay_xxx",  # Asaas payment ID (opcional se pix_payload for fornecido)
        "pix_payload": "00020101...",  # PIX Copia e Cola (opcional se payment_id for fornecido)
        "value": 100.00  # Payment value
    }
    """
    from apps.payments.services.asaas_service import AsaasService
    
    payment_id = request.data.get('payment_id')
    pix_payload = request.data.get('pix_payload')
    value = request.data.get('value')
    
    if not payment_id and not pix_payload:
        return Response(
            {'detail': 'payment_id ou pix_payload é obrigatório'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        asaas = AsaasService()
        
        # Se forneceu payment_id, busca o payload
        if payment_id and not pix_payload:
            # Get PIX QR Code
            pix_qr = asaas._make_request('GET', f'payments/{payment_id}/pixQrCode')
            
            if not pix_qr.get('payload'):
                return Response(
                    {'detail': 'QR Code PIX não encontrado para este pagamento'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            pix_payload = pix_qr['payload']
            
            # Get payment details for value if not provided
            if not value:
                payment_details = asaas._make_request('GET', f'payments/{payment_id}')
                value = float(payment_details.get('value', 0))
        
        # Simulate payment
        pay_payload = {
            'qrCode': {
                'payload': pix_payload
            },
            'value': float(value) if value else 0
        }
        
        result = asaas._make_request('POST', 'pix/qrCodes/pay', pay_payload)
        
        return Response({
            'success': True,
            'message': 'Pagamento PIX simulado com sucesso!',
            'payment_id': payment_id,
            'result': result
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def calculate_payment(request):
    """
    Calculate payment values before creating.
    
    Expected payload:
    {
        "enrollment_id": 1,
        "payment_method": "PIX_CASH",
        "installments": 1
    }
    """
    from apps.enrollments.models import Enrollment
    
    enrollment_id = request.data.get('enrollment_id')
    payment_method = request.data.get('payment_method')
    installments = request.data.get('installments', 1)
    
    try:
        enrollment = Enrollment.objects.get(id=enrollment_id)
    except Enrollment.DoesNotExist:
        return Response(
            {'detail': 'Inscrição não encontrada'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Calculate amounts
    enrollment.payment_method = payment_method
    enrollment.installments = installments
    enrollment.calculate_amounts()
    
    installment_value = enrollment.final_amount / installments if installments > 1 else enrollment.final_amount
    
    return Response({
        'original_amount': float(enrollment.total_amount),
        'discount_amount': float(enrollment.discount_amount),
        'final_amount': float(enrollment.final_amount),
        'installments': installments,
        'installment_value': float(installment_value),
    })
