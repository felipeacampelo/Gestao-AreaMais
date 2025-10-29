"""
Payment models with clean architecture for Asaas integration.
"""
from django.db import models
from django.utils.translation import gettext_lazy as _


class Payment(models.Model):
    """
    Represents a payment transaction via Asaas.
    """
    STATUS_CHOICES = [
        ('CREATED', _('Criado')),
        ('PENDING', _('Pendente')),
        ('CONFIRMED', _('Confirmado')),
        ('RECEIVED', _('Recebido')),
        ('OVERDUE', _('Vencido')),
        ('REFUNDED', _('Reembolsado')),
        ('CANCELLED', _('Cancelado')),
    ]
    
    enrollment = models.ForeignKey(
        'enrollments.Enrollment',
        on_delete=models.CASCADE,
        related_name='payments',
        verbose_name=_('Inscrição')
    )
    
    asaas_payment_id = models.CharField(
        _('ID Pagamento Asaas'),
        max_length=100,
        unique=True,
        null=True,
        blank=True
    )
    
    asaas_subscription_id = models.CharField(
        _('ID Assinatura Asaas'),
        max_length=100,
        null=True,
        blank=True,
        help_text=_('Para pagamentos recorrentes/parcelados')
    )
    
    installment_number = models.IntegerField(
        _('Número da Parcela'),
        default=1,
        help_text=_('Qual parcela este pagamento representa (1-8)')
    )
    
    amount = models.DecimalField(
        _('Valor'),
        max_digits=10,
        decimal_places=2
    )
    
    status = models.CharField(
        _('Status'),
        max_length=20,
        choices=STATUS_CHOICES,
        default='CREATED'
    )
    
    due_date = models.DateField(
        _('Data de Vencimento'),
        null=True,
        blank=True
    )
    
    paid_at = models.DateTimeField(
        _('Pago em'),
        null=True,
        blank=True
    )
    
    # Payment method specific fields
    payment_url = models.URLField(
        _('URL de Pagamento'),
        max_length=500,
        blank=True,
        help_text=_('URL do boleto ou checkout')
    )
    
    pix_qr_code = models.TextField(
        _('QR Code PIX'),
        blank=True,
        help_text=_('Código QR do PIX em base64')
    )
    
    pix_copy_paste = models.TextField(
        _('PIX Copia e Cola'),
        blank=True,
        help_text=_('Código PIX para copiar e colar')
    )
    
    # Webhook data for audit
    raw_webhook_data = models.JSONField(
        _('Dados do Webhook'),
        default=dict,
        blank=True,
        help_text=_('Dados brutos recebidos do webhook Asaas')
    )
    
    created_at = models.DateTimeField(_('Criado em'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Atualizado em'), auto_now=True)
    
    class Meta:
        verbose_name = _('Pagamento')
        verbose_name_plural = _('Pagamentos')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['enrollment', 'status']),
            models.Index(fields=['asaas_payment_id']),
        ]
    
    def __str__(self):
        return f'Pagamento {self.id} - {self.enrollment.user.email} - {self.get_status_display()}'
    
    @property
    def is_paid(self):
        """Check if payment is confirmed or received."""
        return self.status in ['CONFIRMED', 'RECEIVED']
    
    @property
    def is_pending(self):
        """Check if payment is still pending."""
        return self.status in ['CREATED', 'PENDING']
    
    @property
    def can_be_cancelled(self):
        """Check if payment can be cancelled."""
        return self.status in ['CREATED', 'PENDING']
