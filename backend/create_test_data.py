"""
Script to create test data for the enrollment system.
Run: python manage.py shell < create_test_data.py
"""
import os
import django
from datetime import datetime, timedelta
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.utils import timezone
from apps.users.models import User
from apps.products.models import Product, Batch

print("🚀 Criando dados de teste...")

# Create test user
user, created = User.objects.get_or_create(
    email='test@example.com',
    defaults={
        'first_name': 'Test',
        'last_name': 'User',
    }
)
if created:
    user.set_password('test123')
    user.save()
    print(f"✅ Usuário criado: {user.email}")
else:
    print(f"ℹ️  Usuário já existe: {user.email}")

# Create test product
product, created = Product.objects.get_or_create(
    name='Curso de Python Avançado',
    defaults={
        'description': 'Aprenda Python do zero ao avançado com projetos práticos',
        'base_price': Decimal('1000.00'),
        'max_installments': 8,
        'is_active': True,
    }
)
if created:
    print(f"✅ Produto criado: {product.name}")
else:
    print(f"ℹ️  Produto já existe: {product.name}")

# Create active batch
now = timezone.now()
batch, created = Batch.objects.get_or_create(
    product=product,
    name='Turma 1 - 2025',
    defaults={
        'start_date': now,
        'end_date': now + timedelta(days=30),
        'price': Decimal('900.00'),
        'pix_discount_percentage': 10,
        'max_enrollments': 50,
        'status': 'ACTIVE',
    }
)
if created:
    print(f"✅ Lote criado: {batch.name}")
else:
    print(f"ℹ️  Lote já existe: {batch.name}")

# Create another product
product2, created = Product.objects.get_or_create(
    name='Curso de Django REST Framework',
    defaults={
        'description': 'Construa APIs profissionais com Django REST Framework',
        'base_price': Decimal('1200.00'),
        'max_installments': 6,
        'is_active': True,
    }
)
if created:
    print(f"✅ Produto criado: {product2.name}")
else:
    print(f"ℹ️  Produto já existe: {product2.name}")

# Create batch for second product
batch2, created = Batch.objects.get_or_create(
    product=product2,
    name='Turma Especial',
    defaults={
        'start_date': now,
        'end_date': now + timedelta(days=45),
        'price': Decimal('1100.00'),
        'pix_discount_percentage': 15,
        'max_enrollments': 30,
        'status': 'ACTIVE',
    }
)
if created:
    print(f"✅ Lote criado: {batch2.name}")
else:
    print(f"ℹ️  Lote já existe: {batch2.name}")

print("\n" + "="*50)
print("📊 Resumo dos Dados de Teste")
print("="*50)
print(f"👤 Usuário: {user.email} / Senha: test123")
print(f"📚 Produtos: {Product.objects.count()}")
print(f"📦 Lotes: {Batch.objects.count()}")
print(f"✅ Lotes Ativos: {Batch.objects.filter(status='ACTIVE').count()}")
print("\n🔗 URLs para testar:")
print(f"   Admin: http://localhost:8000/admin/")
print(f"   API Products: http://localhost:8000/api/products/")
print(f"   API Batches: http://localhost:8000/api/batches/")
print("="*50)
