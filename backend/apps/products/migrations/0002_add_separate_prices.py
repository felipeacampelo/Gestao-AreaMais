# Generated manually

from django.db import migrations, models
import django.core.validators


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='batch',
            name='pix_installment_price',
            field=models.DecimalField(decimal_places=2, default=0, help_text='Preço para pagamento PIX parcelado', max_digits=10, validators=[django.core.validators.MinValueValidator(0)], verbose_name='Preço PIX Parcelado'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='batch',
            name='credit_card_price',
            field=models.DecimalField(decimal_places=2, default=0, help_text='Preço para pagamento com cartão de crédito', max_digits=10, validators=[django.core.validators.MinValueValidator(0)], verbose_name='Preço Cartão de Crédito'),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name='batch',
            name='price',
            field=models.DecimalField(decimal_places=2, help_text='Preço para pagamento PIX à vista', max_digits=10, validators=[django.core.validators.MinValueValidator(0)], verbose_name='Preço PIX à Vista'),
        ),
        migrations.AlterField(
            model_name='batch',
            name='pix_discount_percentage',
            field=models.DecimalField(blank=True, decimal_places=2, default=0, help_text='Campo obsoleto - usar price, pix_installment_price e credit_card_price', max_digits=5, null=True, validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(100)], verbose_name='Desconto PIX (%) - DEPRECATED'),
        ),
    ]
