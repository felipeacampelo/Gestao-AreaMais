"""
Management command to sync payment statuses with Asaas.
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.payments.models import Payment
from apps.payments.services.asaas_service import AsaasService


class Command(BaseCommand):
    help = 'Sync payment statuses with Asaas API'

    def add_arguments(self, parser):
        parser.add_argument(
            '--payment-id',
            type=int,
            help='Sync specific payment by ID',
        )
        parser.add_argument(
            '--all',
            action='store_true',
            help='Sync all pending payments',
        )

    def handle(self, *args, **options):
        asaas = AsaasService()
        
        if options['payment_id']:
            # Sync specific payment
            try:
                payment = Payment.objects.get(id=options['payment_id'])
                self.sync_payment(payment, asaas)
            except Payment.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'Payment {options["payment_id"]} not found')
                )
        elif options['all']:
            # Sync all payments (not just pending)
            payments = Payment.objects.exclude(asaas_payment_id__isnull=True)
            
            self.stdout.write(f'Found {payments.count()} payments to sync')
            
            for payment in payments:
                self.sync_payment(payment, asaas)
        else:
            self.stdout.write(
                self.style.WARNING('Please specify --payment-id or --all')
            )

    def sync_payment(self, payment, asaas):
        """Sync a single payment with Asaas."""
        try:
            # Get payment status from Asaas
            asaas_payment = asaas.get_payment(payment.asaas_payment_id)
            
            old_status = payment.status
            new_status = asaas_payment.get('status', 'PENDING')
            
            # Map Asaas status to our status
            status_mapping = {
                'PENDING': 'PENDING',
                'RECEIVED': 'RECEIVED',
                'CONFIRMED': 'CONFIRMED',
                'OVERDUE': 'OVERDUE',
                'REFUNDED': 'REFUNDED',
                'RECEIVED_IN_CASH': 'RECEIVED',
                'REFUND_REQUESTED': 'REFUNDED',
            }
            
            mapped_status = status_mapping.get(new_status, new_status)
            
            if old_status != mapped_status:
                payment.status = mapped_status
                
                # Mark as paid if confirmed or received
                if mapped_status in ['CONFIRMED', 'RECEIVED'] and not payment.paid_at:
                    payment.paid_at = timezone.now()
                
                payment.save()
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✓ Payment {payment.id}: {old_status} → {mapped_status}'
                    )
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'- Payment {payment.id}: No change ({old_status})')
                )
            
            # Always check and update enrollment status if payment is paid
            if mapped_status in ['CONFIRMED', 'RECEIVED']:
                enrollment = payment.enrollment
                total_payments = enrollment.payments.count()
                paid_payments = enrollment.payments.filter(status__in=['CONFIRMED', 'RECEIVED']).count()
                
                if total_payments > 0 and paid_payments == total_payments and enrollment.status != 'PAID':
                    enrollment.status = 'PAID'
                    if not enrollment.paid_at:
                        enrollment.paid_at = timezone.now()
                    enrollment.save()
                    self.stdout.write(
                        self.style.SUCCESS(f'✓ Enrollment {enrollment.id} marked as PAID')
                    )
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'✗ Payment {payment.id}: {str(e)}')
            )
