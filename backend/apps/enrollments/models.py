"""
Enrollment models with clean architecture.
"""
from decimal import Decimal
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _


class Enrollment(models.Model):
    """
    Represents a user enrollment in a product/batch.
    """
    STATUS_CHOICES = [
        ('PENDING_PAYMENT', _('Aguardando Pagamento')),
        ('PAID', _('Pago')),
        ('CANCELLED', _('Cancelado')),
        ('EXPIRED', _('Expirado')),
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ('PIX_CASH', _('PIX à Vista')),
        ('PIX_INSTALLMENT', _('PIX Parcelado')),
        ('CREDIT_CARD', _('Cartão de Crédito')),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='enrollments',
        verbose_name=_('Usuário')
    )
    
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.PROTECT,
        related_name='enrollments',
        verbose_name=_('Produto')
    )
    
    batch = models.ForeignKey(
        'products.Batch',
        on_delete=models.PROTECT,
        related_name='enrollments',
        verbose_name=_('Lote')
    )
    
    form_data = models.JSONField(
        _('Dados do Formulário'),
        default=dict,
        blank=True,
        help_text=_('Dados adicionais coletados no formulário de inscrição')
    )
    
    status = models.CharField(
        _('Status'),
        max_length=20,
        choices=STATUS_CHOICES,
        default='PENDING_PAYMENT'
    )
    
    payment_method = models.CharField(
        _('Método de Pagamento'),
        max_length=20,
        choices=PAYMENT_METHOD_CHOICES,
        null=True,
        blank=True
    )
    
    installments = models.IntegerField(
        _('Número de Parcelas'),
        default=1,
        help_text=_('1 para pagamento à vista')
    )
    
    total_amount = models.DecimalField(
        _('Valor Total'),
        max_digits=10,
        decimal_places=2,
        help_text=_('Valor original do lote')
    )
    
    discount_amount = models.DecimalField(
        _('Valor do Desconto'),
        max_digits=10,
        decimal_places=2,
        default=0
    )
    
    final_amount = models.DecimalField(
        _('Valor Final'),
        max_digits=10,
        decimal_places=2,
        help_text=_('Valor após desconto')
    )
    
    admin_notes = models.TextField(
        _('Observações do Admin'),
        blank=True,
        help_text=_('Notas internas visíveis apenas para administradores')
    )
    
    created_at = models.DateTimeField(_('Criado em'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Atualizado em'), auto_now=True)
    paid_at = models.DateTimeField(_('Pago em'), null=True, blank=True)
    
    class Meta:
        verbose_name = _('Inscrição')
        verbose_name_plural = _('Inscrições')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['batch', 'status']),
        ]
    
    def __str__(self):
        return f'{self.user.email} - {self.product.name}'
    
    @property
    def installment_value(self):
        """Calculate value per installment."""
        if self.installments <= 0:
            return self.final_amount
        return self.final_amount / self.installments
    
    @property
    def is_paid(self):
        """Check if enrollment is paid."""
        return self.status == 'PAID'
    
    def calculate_amounts(self):
        """Calculate total, discount and final amounts based on batch and payment method."""
        self.total_amount = self.batch.price
        
        # Apply PIX discount if payment is PIX à vista
        if self.payment_method == 'PIX_CASH':
            discount_percentage = self.batch.pix_discount_percentage
            self.discount_amount = self.total_amount * (discount_percentage / 100)
        else:
            self.discount_amount = Decimal('0.00')
        
        self.final_amount = self.total_amount - self.discount_amount
    
    def save(self, *args, **kwargs):
        """Auto-calculate amounts before saving."""
        if self.batch and self.total_amount is None:
            self.calculate_amounts()
        super().save(*args, **kwargs)
