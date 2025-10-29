"""
Enrollments admin configuration.
"""
from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from .models import Enrollment


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    """Admin for Enrollment model."""
    
    list_display = ['id', 'user_info', 'product', 'batch', 'status_badge', 'payment_method_display', 'final_amount', 'installments', 'created_at']
    list_filter = ['status', 'payment_method', 'batch__product', 'created_at']
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'product__name']
    readonly_fields = ['created_at', 'updated_at', 'paid_at', 'total_amount', 'discount_amount', 'final_amount']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        (_('Usuário e Produto'), {
            'fields': ('user', 'product', 'batch')
        }),
        (_('Dados do Formulário'), {
            'fields': ('form_data',),
            'classes': ('collapse',)
        }),
        (_('Pagamento'), {
            'fields': ('payment_method', 'installments', 'total_amount', 'discount_amount', 'final_amount')
        }),
        (_('Status'), {
            'fields': ('status', 'paid_at')
        }),
        (_('Observações do Admin'), {
            'fields': ('admin_notes',)
        }),
        (_('Datas'), {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['mark_as_paid', 'cancel_enrollments', 'export_to_csv']
    
    def user_info(self, obj):
        """Display user information with link."""
        url = reverse('admin:users_user_change', args=[obj.user.id])
        return format_html(
            '<a href="{}">{}</a><br><small style="color: gray;">{}</small>',
            url,
            obj.user.get_full_name() or obj.user.email,
            obj.user.email
        )
    user_info.short_description = _('Usuário')
    
    def status_badge(self, obj):
        """Display status with color badge."""
        colors = {
            'PENDING_PAYMENT': 'orange',
            'PAID': 'green',
            'CANCELLED': 'red',
            'EXPIRED': 'gray',
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = _('Status')
    
    def payment_method_display(self, obj):
        """Display payment method with icon."""
        if not obj.payment_method:
            return '-'
        
        icons = {
            'PIX_CASH': '💰',
            'PIX_INSTALLMENT': '📅',
            'CREDIT_CARD': '💳',
        }
        icon = icons.get(obj.payment_method, '')
        return format_html(
            '{} {}',
            icon,
            obj.get_payment_method_display()
        )
    payment_method_display.short_description = _('Método')
    
    def mark_as_paid(self, request, queryset):
        """Mark selected enrollments as paid."""
        updated = queryset.filter(status='PENDING_PAYMENT').update(
            status='PAID',
            paid_at=timezone.now()
        )
        self.message_user(request, f'{updated} inscrição(ões) marcada(s) como paga(s).')
    mark_as_paid.short_description = _('Marcar como pago')
    
    def cancel_enrollments(self, request, queryset):
        """Cancel selected enrollments."""
        updated = queryset.exclude(status='CANCELLED').update(status='CANCELLED')
        self.message_user(request, f'{updated} inscrição(ões) cancelada(s).')
    cancel_enrollments.short_description = _('Cancelar inscrições')
    
    def export_to_csv(self, request, queryset):
        """Export enrollments to CSV."""
        import csv
        from django.http import HttpResponse
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="inscricoes.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['ID', 'Usuário', 'Email', 'Produto', 'Lote', 'Status', 'Valor', 'Data'])
        
        for enrollment in queryset:
            writer.writerow([
                enrollment.id,
                enrollment.user.get_full_name() or enrollment.user.email,
                enrollment.user.email,
                enrollment.product.name,
                enrollment.batch.name,
                enrollment.get_status_display(),
                enrollment.final_amount,
                enrollment.created_at.strftime('%d/%m/%Y %H:%M')
            ])
        
        return response
    export_to_csv.short_description = _('Exportar para CSV')
