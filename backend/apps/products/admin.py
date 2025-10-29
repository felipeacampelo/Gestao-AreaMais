"""
Products admin configuration.
"""
from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from django.utils.html import format_html
from .models import Product, Batch


class BatchInline(admin.TabularInline):
    """Inline admin for batches within product."""
    model = Batch
    extra = 0
    fields = ['name', 'start_date', 'end_date', 'price', 'pix_discount_percentage', 'max_enrollments', 'status']
    readonly_fields = ['status']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    """Admin for Product model."""
    
    list_display = ['name', 'base_price', 'max_installments', 'is_active', 'active_batch_info', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        (_('Informações Básicas'), {
            'fields': ('name', 'description', 'image')
        }),
        (_('Preços e Parcelamento'), {
            'fields': ('base_price', 'max_installments')
        }),
        (_('Evento'), {
            'fields': ('event_date',)
        }),
        (_('Status'), {
            'fields': ('is_active',)
        }),
        (_('Datas'), {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    inlines = [BatchInline]
    
    def active_batch_info(self, obj):
        """Display active batch information."""
        batch = obj.get_active_batch()
        if batch:
            return format_html(
                '<span style="color: green;">✓ {}</span>',
                batch.name
            )
        return format_html('<span style="color: gray;">Nenhum lote ativo</span>')
    active_batch_info.short_description = _('Lote Ativo')


@admin.register(Batch)
class BatchAdmin(admin.ModelAdmin):
    """Admin for Batch model."""
    
    list_display = ['name', 'product', 'price', 'pix_discount_percentage', 'status_badge', 'enrollment_progress', 'date_range']
    list_filter = ['status', 'product', 'start_date']
    search_fields = ['name', 'product__name']
    readonly_fields = ['status', 'created_at', 'updated_at', 'current_enrollments']
    date_hierarchy = 'start_date'
    
    fieldsets = (
        (_('Produto'), {
            'fields': ('product',)
        }),
        (_('Informações do Lote'), {
            'fields': ('name', 'start_date', 'end_date')
        }),
        (_('Preços'), {
            'fields': ('price', 'pix_discount_percentage')
        }),
        (_('Vagas'), {
            'fields': ('max_enrollments', 'current_enrollments')
        }),
        (_('Status'), {
            'fields': ('status',)
        }),
        (_('Datas'), {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def status_badge(self, obj):
        """Display status with color badge."""
        colors = {
            'SCHEDULED': 'gray',
            'ACTIVE': 'green',
            'FULL': 'orange',
            'ENDED': 'red',
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = _('Status')
    
    def enrollment_progress(self, obj):
        """Display enrollment progress bar."""
        if obj.max_enrollments:
            percentage = (obj.current_enrollments / obj.max_enrollments) * 100
            color = 'green' if percentage < 80 else 'orange' if percentage < 100 else 'red'
            return format_html(
                '<div style="width: 100px; background-color: #f0f0f0; border-radius: 3px;">'
                '<div style="width: {}%; background-color: {}; height: 20px; border-radius: 3px; text-align: center; color: white; font-size: 11px; line-height: 20px;">{}/{}</div>'
                '</div>',
                min(percentage, 100),
                color,
                obj.current_enrollments,
                obj.max_enrollments
            )
        return format_html('{} (ilimitado)', obj.current_enrollments)
    enrollment_progress.short_description = _('Inscrições')
    
    def date_range(self, obj):
        """Display date range."""
        return format_html(
            '{}<br><small style="color: gray;">até {}</small>',
            obj.start_date.strftime('%d/%m/%Y %H:%M'),
            obj.end_date.strftime('%d/%m/%Y %H:%M')
        )
    date_range.short_description = _('Período')
    
    actions = ['activate_batches', 'deactivate_batches']
    
    def activate_batches(self, request, queryset):
        """Activate selected batches."""
        updated = queryset.update(status='ACTIVE')
        self.message_user(request, f'{updated} lote(s) ativado(s).')
    activate_batches.short_description = _('Ativar lotes selecionados')
    
    def deactivate_batches(self, request, queryset):
        """Deactivate selected batches."""
        updated = queryset.update(status='ENDED')
        self.message_user(request, f'{updated} lote(s) desativado(s).')
    deactivate_batches.short_description = _('Desativar lotes selecionados')
