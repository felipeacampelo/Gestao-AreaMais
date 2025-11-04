"""
Payment service for managing enrollment payments with Asaas.
"""
from decimal import Decimal
from datetime import date, timedelta
from typing import Dict, List, Optional
from django.utils import timezone
from django.db import transaction

from apps.enrollments.models import Enrollment
from apps.payments.models import Payment
from apps.users.models import UserProfile
from .asaas_service import AsaasService, AsaasAPIException


class PaymentService:
    """
    High-level service for managing payments.
    Orchestrates Asaas integration with local database.
    """
    
    def __init__(self):
        self.asaas = AsaasService()
    
    def ensure_customer_exists(self, user) -> str:
        """
        Ensure user has an Asaas customer ID.
        Creates customer if doesn't exist.
        
        Args:
            user: User instance
            
        Returns:
            Asaas customer ID
        """
        if not user or not hasattr(user, 'email'):
            raise ValueError("Invalid user for payment creation")
        
        profile, created = UserProfile.objects.get_or_create(user=user)
        
        if profile.asaas_customer_id:
            return profile.asaas_customer_id
        
        # Create customer in Asaas
        # Get CPF from enrollment form_data first (more recent), then from profile
        cpf = None
        
        # Try to get from latest enrollment first
        from apps.enrollments.models import Enrollment
        enrollment = Enrollment.objects.filter(user=user).order_by('-created_at').first()
        if enrollment and enrollment.form_data:
            cpf = enrollment.form_data.get('cpf', '')
        
        # If not found in enrollment, use profile CPF
        if not cpf:
            cpf = profile.cpf
        
        # Debug: CPF before cleaning
        print(f"🔍 DEBUG - CPF ANTES de limpar: '{cpf}' (type: {type(cpf)})")
        
        # Clean CPF format (remove dots, dashes, spaces)
        if cpf:
            cpf = cpf.replace('.', '').replace('-', '').replace(' ', '').strip()
        
        # Debug: CPF after cleaning
        print(f"🔍 DEBUG - CPF DEPOIS de limpar: '{cpf}' (length: {len(cpf) if cpf else 0}, isdigit: {cpf.isdigit() if cpf else False})")
        
        # Validate CPF format
        if not cpf or len(cpf) != 11 or not cpf.isdigit():
            raise ValueError(f"CPF válido é obrigatório para criar pagamento. CPF fornecido: {cpf}")
        
        # Validate CPF algorithm
        from ..utils import validate_cpf
        if not validate_cpf(cpf):
            raise ValueError(f"CPF inválido. Por favor, verifique o número digitado. CPF: {cpf}")
        
        customer_data = self.asaas.create_customer(
            name=user.get_full_name() or user.email,
            email=user.email,
            cpf_cnpj=cpf,
            phone=profile.phone
        )
        
        profile.asaas_customer_id = customer_data['id']
        profile.save()
        
        return profile.asaas_customer_id
    
    @transaction.atomic
    def create_pix_cash_payment(
        self,
        enrollment: Enrollment,
        due_days: int = 3
    ) -> Payment:
        """
        Create PIX à vista payment.
        
        Args:
            enrollment: Enrollment instance
            due_days: Days until due date
            
        Returns:
            Payment instance with PIX QR code
        """
        # Ensure customer exists
        customer_id = self.ensure_customer_exists(enrollment.user)
        
        # Calculate due date
        due_date = timezone.now().date() + timedelta(days=due_days)
        
        # Create payment in Asaas
        asaas_payment = self.asaas.create_pix_payment(
            customer_id=customer_id,
            value=enrollment.final_amount,
            due_date=due_date,
            description=f'Inscrição - {enrollment.product.name}',
            external_reference=str(enrollment.id)
        )
        
        # Get PIX QR code
        pix_data = self.asaas.get_pix_qrcode(asaas_payment['id'])
        
        # Create local payment record
        payment = Payment.objects.create(
            enrollment=enrollment,
            asaas_payment_id=asaas_payment['id'],
            installment_number=1,
            amount=enrollment.final_amount,
            status='PENDING',
            due_date=due_date,
            payment_url=asaas_payment.get('invoiceUrl', ''),
            pix_qr_code=pix_data.get('encodedImage', ''),
            pix_copy_paste=pix_data.get('payload', ''),
            raw_webhook_data={'created': asaas_payment}
        )
        
        return payment
    
    @transaction.atomic
    def create_pix_installment_payments(
        self,
        enrollment: Enrollment,
        installments: int
    ) -> List[Payment]:
        """
        Create multiple PIX payments for installment plan.
        
        Args:
            enrollment: Enrollment instance
            installments: Number of installments (2-8)
            
        Returns:
            List of Payment instances
        """
        # Ensure customer exists
        customer_id = self.ensure_customer_exists(enrollment.user)
        
        # Calculate installment value
        installment_value = enrollment.final_amount / installments
        
        payments = []
        for i in range(1, installments + 1):
            # Due date: 30 days apart
            due_date = timezone.now().date() + timedelta(days=30 * i)
            
            # Create payment in Asaas
            asaas_payment = self.asaas.create_pix_payment(
                customer_id=customer_id,
                value=installment_value,
                due_date=due_date,
                description=f'Inscrição - {enrollment.product.name} - Parcela {i}/{installments}',
                external_reference=f'{enrollment.id}-{i}'
            )
            
            # Get PIX QR code
            pix_data = self.asaas.get_pix_qrcode(asaas_payment['id'])
            
            # Create local payment record
            payment = Payment.objects.create(
                enrollment=enrollment,
                asaas_payment_id=asaas_payment['id'],
                installment_number=i,
                amount=installment_value,
                status='PENDING' if i == 1 else 'CREATED',
                due_date=due_date,
                payment_url=asaas_payment.get('invoiceUrl', ''),
                pix_qr_code=pix_data.get('encodedImage', ''),
                pix_copy_paste=pix_data.get('payload', ''),
                raw_webhook_data={'created': asaas_payment}
            )
            
            payments.append(payment)
        
        return payments
    
    @transaction.atomic
    def create_credit_card_payment(
        self,
        enrollment: 'Enrollment',
        installments: int = 1,
        credit_card_token: Optional[str] = None,
        credit_card_data: Optional[dict] = None
    ) -> 'Payment':
        """
        Create credit card payment.
        
        Args:
            enrollment: Enrollment instance
            installments: Number of installments
            credit_card_token: Tokenized credit card from frontend
            
        Returns:
            Payment instance
        """
        # Ensure customer exists
        customer_id = self.ensure_customer_exists(enrollment.user)
        
        # Due date (immediate for credit card)
        due_date = timezone.now().date()
        
        # Prepare holder info from enrollment form_data
        form_data = enrollment.form_data or {}
        
        # Normalize phone (remove non-digits)
        phone = form_data.get('telefone', '')
        if phone:
            import re
            phone = re.sub(r'\D', '', phone)
        
        # Normalize CPF (remove non-digits)
        cpf = form_data.get('cpf', '')
        if cpf:
            import re
            cpf = re.sub(r'\D', '', cpf)
        
        # Normalize CEP (remove non-digits)
        cep = form_data.get('cep', '')
        if cep:
            import re
            cep = re.sub(r'\D', '', cep)
        
        holder_info = {
            'name': enrollment.user.get_full_name() or form_data.get('nome_completo') or enrollment.user.email,
            'email': enrollment.user.email,
            'cpfCnpj': cpf,
            'postalCode': cep or '01310100',  # Usa CEP do formulário ou padrão
            'addressNumber': 'S/N',
        }
        
        # Add phone if available
        if phone and len(phone) >= 10:
            holder_info['phone'] = phone
            holder_info['mobilePhone'] = phone
        
        # Create payment in Asaas using card data directly
        asaas_payment = self.asaas.create_credit_card_payment(
            customer_id=customer_id,
            value=enrollment.final_amount,
            card_data=credit_card_data or {},
            description=f'Inscrição - {enrollment.product.name}',
            external_reference=str(enrollment.id),
            installments=installments,
            holder_info=holder_info
        )
        
        # Create local payment record
        payment = Payment.objects.create(
            enrollment=enrollment,
            asaas_payment_id=asaas_payment['id'],
            installment_number=1,
            amount=enrollment.final_amount,
            status='PENDING',
            due_date=due_date,
            payment_url=asaas_payment.get('invoiceUrl', ''),
            raw_webhook_data={'created': asaas_payment}
        )
        
        return payment
    
    def process_webhook(self, webhook_data: Dict) -> None:
        """
        Process Asaas webhook event.
        
        Args:
            webhook_data: Webhook payload from Asaas
        """
        event = webhook_data.get('event')
        payment_data = webhook_data.get('payment', {})
        payment_id = payment_data.get('id')
        
        if not payment_id:
            return
        
        try:
            payment = Payment.objects.get(asaas_payment_id=payment_id)
        except Payment.DoesNotExist:
            # Payment not found, ignore
            return
        
        # Update payment based on event
        status_mapping = {
            'PAYMENT_CREATED': 'CREATED',
            'PAYMENT_UPDATED': 'PENDING',
            'PAYMENT_CONFIRMED': 'CONFIRMED',
            'PAYMENT_RECEIVED': 'RECEIVED',
            'PAYMENT_OVERDUE': 'OVERDUE',
            'PAYMENT_REFUNDED': 'REFUNDED',
            'PAYMENT_DELETED': 'CANCELLED',
        }
        
        new_status = status_mapping.get(event)
        if new_status:
            payment.status = new_status
            
            # Mark as paid if confirmed or received
            if new_status in ['CONFIRMED', 'RECEIVED'] and not payment.paid_at:
                payment.paid_at = timezone.now()
            
            # Update raw webhook data
            payment.raw_webhook_data = webhook_data
            payment.save()
            
            # Update enrollment if all payments are paid
            enrollment = payment.enrollment
            total_payments = enrollment.payments.count()
            paid_payments = enrollment.payments.filter(status__in=['CONFIRMED', 'RECEIVED']).count()
            
            if total_payments > 0 and paid_payments == total_payments:
                enrollment.status = 'PAID'
                if not enrollment.paid_at:
                    enrollment.paid_at = timezone.now()
                enrollment.save()
                
                # Send payment confirmation email
                try:
                    from apps.enrollments.email_service import send_payment_confirmation_email
                    send_payment_confirmation_email(enrollment)
                except Exception as e:
                    print(f"Erro ao enviar email de confirmação de pagamento: {e}")
    
    def _send_payment_confirmation_email(self, payment: 'Payment') -> None:
        """Send payment confirmation email to user."""
        from django.core.mail import send_mail
        from django.conf import settings
        
        enrollment = payment.enrollment
        user = enrollment.user
        
        subject = f'Pagamento Confirmado - {enrollment.product.name}'
        message = f"""
Olá {user.get_full_name() or user.email},

Seu pagamento foi confirmado com sucesso!

Detalhes da Inscrição:
- Produto: {enrollment.product.name}
- Valor: R$ {payment.amount}
- Data do Pagamento: {payment.paid_at.strftime('%d/%m/%Y %H:%M') if payment.paid_at else 'N/A'}

Obrigado pela sua inscrição!

Atenciosamente,
Equipe AreaMais
        """
        
        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )
        except Exception as e:
            # Log error but don't fail the webhook
            print(f"Error sending email: {e}")
    
    def cancel_payment(self, payment: Payment) -> None:
        """
        Cancel a payment in Asaas and locally.
        
        Args:
            payment: Payment instance
        """
        if not payment.can_be_cancelled:
            raise ValueError('Payment cannot be cancelled')
        
        try:
            self.asaas.cancel_payment(payment.asaas_payment_id)
            payment.status = 'CANCELLED'
            payment.save()
        except AsaasAPIException as e:
            raise ValueError(f'Failed to cancel payment: {str(e)}')
    
    def refund_payment(self, payment: Payment, amount: Decimal = None) -> None:
        """
        Refund a payment.
        
        Args:
            payment: Payment instance
            amount: Partial refund amount (optional)
        """
        if not payment.is_paid:
            raise ValueError('Only paid payments can be refunded')
        
        try:
            self.asaas.refund_payment(payment.asaas_payment_id, amount)
            payment.status = 'REFUNDED'
            payment.save()
            
            # Update enrollment status
            enrollment = payment.enrollment
            enrollment.status = 'CANCELLED'
            enrollment.save()
        except AsaasAPIException as e:
            raise ValueError(f'Failed to refund payment: {str(e)}')
