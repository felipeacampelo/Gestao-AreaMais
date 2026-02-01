"""
Management command to initialize default settings.
"""
from django.core.management.base import BaseCommand
from apps.enrollments.models import Settings


class Command(BaseCommand):
    help = 'Initialize default settings for the application'

    def handle(self, *args, **options):
        settings, created = Settings.objects.get_or_create(pk=1)
        
        if created:
            self.stdout.write(
                self.style.SUCCESS(
                    f'✓ Settings criadas com sucesso!\n'
                    f'  - Máximo de parcelas padrão: {settings.max_installments}x\n'
                    f'  - Máximo de parcelas com cupom: {settings.max_installments_with_coupon}x'
                )
            )
        else:
            self.stdout.write(
                self.style.WARNING(
                    f'⚠ Settings já existem!\n'
                    f'  - Máximo de parcelas padrão: {settings.max_installments}x\n'
                    f'  - Máximo de parcelas com cupom: {settings.max_installments_with_coupon}x\n'
                    f'  Edite no Django Admin para alterar.'
                )
            )
