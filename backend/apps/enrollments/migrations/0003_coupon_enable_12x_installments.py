# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('enrollments', '0002_enrollment_coupon_discount_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='coupon',
            name='enable_12x_installments',
            field=models.BooleanField(default=False, help_text='Permite parcelamento em até 12x (padrão é 7x)', verbose_name='Habilitar 12x'),
        ),
    ]
