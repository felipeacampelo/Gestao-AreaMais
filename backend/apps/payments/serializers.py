"""
Payment serializers.
"""
from rest_framework import serializers
from .models import Payment
from apps.enrollments.serializers import EnrollmentListSerializer


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for Payment model."""
    
    enrollment = EnrollmentListSerializer(read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id',
            'enrollment',
            'asaas_payment_id',
            'installment_number',
            'amount',
            'status',
            'due_date',
            'paid_at',
            'payment_url',
            'pix_qr_code',
            'pix_copy_paste',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class PaymentCreateSerializer(serializers.Serializer):
    """Serializer for creating payment."""
    
    enrollment_id = serializers.IntegerField()
    payment_method = serializers.ChoiceField(
        choices=['PIX_CASH', 'PIX_INSTALLMENT', 'CREDIT_CARD']
    )
    installments = serializers.IntegerField(default=1, min_value=1, max_value=8)
    credit_card_token = serializers.CharField(required=False, allow_blank=True)
    credit_card_data = serializers.JSONField(required=False)
    
    def validate(self, data):
        """Validate payment data."""
        from apps.enrollments.models import Enrollment
        
        # Validate enrollment
        try:
            enrollment = Enrollment.objects.get(id=data['enrollment_id'])
        except Enrollment.DoesNotExist:
            raise serializers.ValidationError({'enrollment_id': 'Inscrição não encontrada'})
        
        if enrollment.status != 'PENDING_PAYMENT':
            raise serializers.ValidationError({'enrollment_id': 'Inscrição já possui pagamento'})
        
        # Validate installments
        payment_method = data['payment_method']
        installments = data['installments']
        
        if payment_method == 'PIX_CASH' and installments != 1:
            raise serializers.ValidationError({'installments': 'PIX à vista deve ter 1 parcela'})
        
        if payment_method in ['PIX_INSTALLMENT', 'CREDIT_CARD']:
            max_installments = enrollment.product.max_installments
            if installments > max_installments:
                raise serializers.ValidationError({
                    'installments': f'Máximo de {max_installments} parcelas permitidas'
                })
        
        if payment_method == 'CREDIT_CARD':
            if not data.get('credit_card_token') and not data.get('credit_card_data'):
                raise serializers.ValidationError({
                    'credit_card': 'Token ou dados do cartão são obrigatórios'
                })
        
        data['enrollment'] = enrollment
        return data
    
    def create(self, validated_data):
        """Create payment using PaymentService."""
        from apps.payments.services import PaymentService
        import logging
        logger = logging.getLogger(__name__)
        
        enrollment = validated_data['enrollment']
        payment_method = validated_data['payment_method']
        installments = validated_data['installments']
        credit_card_token = validated_data.get('credit_card_token')
        credit_card_data = validated_data.get('credit_card_data')
        
        logger.info(f"Creating payment - Method: {payment_method}, Has token: {bool(credit_card_token)}, Has data: {bool(credit_card_data)}")
        
        # Update enrollment with payment info
        enrollment.payment_method = payment_method
        enrollment.installments = installments
        enrollment.save()
        
        service = PaymentService()
        
        try:
            if payment_method == 'PIX_CASH':
                payment = service.create_pix_cash_payment(enrollment)
            elif payment_method == 'PIX_INSTALLMENT':
                payments = service.create_pix_installment_payments(enrollment, installments)
                payment = payments[0]  # Return first payment
            else:  # CREDIT_CARD
                payment = service.create_credit_card_payment(
                    enrollment,
                    installments,
                    credit_card_token,
                    credit_card_data
                )
            
            return payment
            
        except Exception as e:
            raise serializers.ValidationError({'error': str(e)})


class PaymentListSerializer(serializers.ModelSerializer):
    """Simplified serializer for payment listing."""
    
    class Meta:
        model = Payment
        fields = [
            'id',
            'installment_number',
            'amount',
            'status',
            'due_date',
            'paid_at',
        ]
