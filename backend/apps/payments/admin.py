"""
Payments admin configuration.
"""
from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from django.utils.html import format_html
from django.urls import reverse
from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    """Admin for Payment model."""
    
    list_display = ['id', 'enrollment_link', 'installment_info', 'amount', 'status_badge', 'due_date', 'paid_at', 'created_at']
    list_filter = ['status', 'created_at', 'due_date']
    search_fields = ['enrollment__user__email', 'asaas_payment_id', 'asaas_subscription_id']
    readonly_fields = ['asaas_payment_id', 'asaas_subscription_id', 'created_at', 'updated_at', 'raw_webhook_data']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        (_('Inscrição'), {
            'fields': ('enrollment',)
        }),
        (_('Asaas'), {
            'fields': ('asaas_payment_id', 'asaas_subscription_id')
        }),
        (_('Detalhes do Pagamento'), {
            'fields': ('installment_number', 'amount', 'status', 'due_date', 'paid_at')
        }),
        (_('Informações de Pagamento'), {
            'fields': ('payment_url', 'pix_qr_code', 'pix_copy_paste'),
            'classes': ('collapse',)
        }),
        (_('Webhook Data'), {
            'fields': ('raw_webhook_data',),
            'classes': ('collapse',)
        }),
        (_('Datas'), {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['mark_as_confirmed', 'cancel_payments']
    
    def enrollment_link(self, obj):
        """Display enrollment with link."""
        url = reverse('admin:enrollments_enrollment_change', args=[obj.enrollment.id])
        return format_html(
            '<a href="{}">#{}</a><br><small style="color: gray;">{}</small>',
            url,
            obj.enrollment.id,
            obj.enrollment.user.email
        )
    enrollment_link.short_description = _('Inscrição')
    
    def installment_info(self, obj):
        """Display installment information."""
        total = obj.enrollment.installments
        if total > 1:
            return format_html(
                '<strong>{}/{}</strong>',
                obj.installment_number,
                total
            )
        return format_html('<span style="color: green;">À vista</span>')
    installment_info.short_description = _('Parcela')
    
    def status_badge(self, obj):
        """Display status with color badge."""
        colors = {
            'CREATED': 'gray',
            'PENDING': 'orange',
            'CONFIRMED': 'blue',
            'RECEIVED': 'green',
            'OVERDUE': 'red',
            'REFUNDED': 'purple',
            'CANCELLED': 'darkgray',
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = _('Status')
    
    def mark_as_confirmed(self, request, queryset):
        """Mark selected payments as confirmed."""
        from django.utils import timezone
        updated = 0
        for payment in queryset.filter(status__in=['CREATED', 'PENDING']):
            payment.status = 'CONFIRMED'
            payment.paid_at = timezone.now()
            payment.save()
            
            # Update enrollment if all payments are confirmed
            enrollment = payment.enrollment
            all_paid = all(p.is_paid for p in enrollment.payments.all())
            if all_paid and enrollment.status != 'PAID':
                enrollment.status = 'PAID'
                enrollment.paid_at = timezone.now()
                enrollment.save()
            
            updated += 1
        
        self.message_user(request, f'{updated} pagamento(s) confirmado(s).')
    mark_as_confirmed.short_description = _('Marcar como confirmado')
    
    def cancel_payments(self, request, queryset):
        """Cancel selected payments."""
        updated = queryset.filter(status__in=['CREATED', 'PENDING']).update(status='CANCELLED')
        self.message_user(request, f'{updated} pagamento(s) cancelado(s).')
    cancel_payments.short_description = _('Cancelar pagamentos')
