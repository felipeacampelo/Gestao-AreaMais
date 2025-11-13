"""
Enrollments admin configuration.
"""
from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from .models import Enrollment, Coupon


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    """Admin for Enrollment model."""
    
    list_display = ['id', 'user_info', 'product', 'batch', 'status_badge', 'payment_method_display', 'final_amount', 'installments', 'shirt_size', 'pg_leader', 'created_at']
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
    
    def shirt_size(self, obj):
        """Display shirt size from form_data."""
        return obj.form_data.get('tamanho_camiseta', '-')
    shirt_size.short_description = _('Camiseta')
    
    def pg_leader(self, obj):
        """Display PG leader from form_data."""
        return obj.form_data.get('lider_pg', '-')
    pg_leader.short_description = _('Líder PG')
    
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
        """Export enrollments to CSV with all form data."""
        import csv
        from django.http import HttpResponse
        
        response = HttpResponse(content_type='text/csv; charset=utf-8-sig')
        response['Content-Disposition'] = 'attachment; filename="inscricoes.csv"'
        
        writer = csv.writer(response)
        # Header with all fields
        writer.writerow([
            'ID', 'Nome Completo', 'Email', 'Telefone', 'CPF', 'RG',
            'Data Nascimento', 'Tamanho Camiseta', 'Membro Batista Capital',
            'Igreja', 'Líder PG', 'Produto', 'Lote', 'Status',
            'Método Pagamento', 'Parcelas', 'Valor Total', 'Desconto',
            'Valor Final', 'Data Inscrição', 'Data Pagamento'
        ])
        
        for enrollment in queryset:
            form_data = enrollment.form_data
            writer.writerow([
                enrollment.id,
                form_data.get('nome_completo', ''),
                form_data.get('email', ''),
                form_data.get('telefone', ''),
                form_data.get('cpf', ''),
                form_data.get('rg', ''),
                form_data.get('data_nascimento', ''),
                form_data.get('tamanho_camiseta', ''),
                form_data.get('membro_batista_capital', ''),
                form_data.get('igreja', ''),
                form_data.get('lider_pg', ''),
                enrollment.product.name,
                enrollment.batch.name,
                enrollment.get_status_display(),
                enrollment.get_payment_method_display() if enrollment.payment_method else '',
                enrollment.installments or '',
                enrollment.total_amount,
                enrollment.discount_amount,
                enrollment.final_amount,
                enrollment.created_at.strftime('%d/%m/%Y %H:%M'),
                enrollment.paid_at.strftime('%d/%m/%Y %H:%M') if enrollment.paid_at else ''
            ])
        
        return response
    export_to_csv.short_description = _('Exportar para CSV')


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    """Admin for Coupon model."""
    
    list_display = ['code', 'discount_display', 'active_badge', 'uses_display', 'valid_period', 'created_at']
    list_filter = ['active', 'discount_type', 'created_at']
    search_fields = ['code', 'description']
    readonly_fields = ['uses_count', 'created_at', 'updated_at']
    filter_horizontal = ['products']
    
    fieldsets = (
        (_('Informações Básicas'), {
            'fields': ('code', 'description', 'active')
        }),
        (_('Desconto'), {
            'fields': ('discount_type', 'discount_value', 'max_discount')
        }),
        (_('Restrições'), {
            'fields': ('min_purchase', 'max_uses', 'uses_count', 'products')
        }),
        (_('Validade'), {
            'fields': ('valid_from', 'valid_until')
        }),
        (_('Datas'), {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def discount_display(self, obj):
        """Display discount with formatting."""
        return obj.get_discount_display()
    discount_display.short_description = _('Desconto')
    
    def active_badge(self, obj):
        """Display active status with badge."""
        is_valid, _ = obj.is_valid()
        if is_valid:
            return format_html(
                '<span style="background-color: green; color: white; padding: 3px 10px; border-radius: 3px;">✓ Ativo</span>'
            )
        return format_html(
            '<span style="background-color: red; color: white; padding: 3px 10px; border-radius: 3px;">✗ Inativo</span>'
        )
    active_badge.short_description = _('Status')
    
    def uses_display(self, obj):
        """Display usage count."""
        if obj.max_uses:
            return f'{obj.uses_count}/{obj.max_uses}'
        return f'{obj.uses_count}/∞'
    uses_display.short_description = _('Usos')
    
    def valid_period(self, obj):
        """Display validity period."""
        return format_html(
            '{}<br><small style="color: gray;">até {}</small>',
            obj.valid_from.strftime('%d/%m/%Y'),
            obj.valid_until.strftime('%d/%m/%Y')
        )
    valid_period.short_description = _('Período')
