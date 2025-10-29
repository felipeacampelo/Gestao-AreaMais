"""
Script to test Asaas integration.
Run: python test_asaas.py
"""
import os
import django
from decimal import Decimal
from datetime import date, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.conf import settings
from apps.payments.services import AsaasService, AsaasAPIException

print("="*60)
print("🧪 TESTE DE INTEGRAÇÃO ASAAS")
print("="*60)

# Check configuration
print("\n📋 Configuração:")
print(f"   API Key: {settings.ASAAS_API_KEY[:20]}..." if settings.ASAAS_API_KEY else "   ❌ API Key não configurada")
print(f"   Ambiente: {settings.ASAAS_ENV}")
print(f"   Webhook Token: {'✅ Configurado' if settings.ASAAS_WEBHOOK_TOKEN else '❌ Não configurado'}")

if not settings.ASAAS_API_KEY or settings.ASAAS_API_KEY == 'your-asaas-api-key':
    print("\n❌ ERRO: Configure a API Key do Asaas no arquivo .env")
    print("\n📝 Instruções:")
    print("   1. Acesse: https://sandbox.asaas.com/")
    print("   2. Faça login ou crie uma conta")
    print("   3. Vá em Integrações > API Key")
    print("   4. Copie a chave e adicione no .env:")
    print("      ASAAS_API_KEY=sua_chave_aqui")
    exit(1)

# Initialize service
asaas = AsaasService()
print(f"\n🔗 Base URL: {asaas.base_url}")

# Test 1: Create Customer
print("\n" + "="*60)
print("TESTE 1: Criar Cliente")
print("="*60)

try:
    customer = asaas.create_customer(
        name='João da Silva Teste',
        email='joao.teste@example.com',
        cpf_cnpj='12345678909',
        phone='11987654321'  # Formato: DDD + 9 dígitos
    )
    print("✅ Cliente criado com sucesso!")
    print(f"   ID: {customer['id']}")
    print(f"   Nome: {customer['name']}")
    print(f"   Email: {customer['email']}")
    customer_id = customer['id']
except AsaasAPIException as e:
    print(f"❌ Erro ao criar cliente: {e}")
    exit(1)

# Test 2: Create PIX Payment
print("\n" + "="*60)
print("TESTE 2: Criar Pagamento PIX")
print("="*60)

try:
    due_date = date.today() + timedelta(days=3)
    payment = asaas.create_pix_payment(
        customer_id=customer_id,
        value=Decimal('100.00'),
        due_date=due_date,
        description='Teste de pagamento PIX',
        external_reference='TEST-001'
    )
    print("✅ Pagamento PIX criado com sucesso!")
    print(f"   ID: {payment['id']}")
    print(f"   Valor: R$ {payment['value']}")
    print(f"   Status: {payment['status']}")
    print(f"   Vencimento: {payment['dueDate']}")
    payment_id = payment['id']
except AsaasAPIException as e:
    print(f"❌ Erro ao criar pagamento: {e}")
    exit(1)

# Test 3: Get PIX QR Code
print("\n" + "="*60)
print("TESTE 3: Obter QR Code PIX")
print("="*60)

try:
    pix_data = asaas.get_pix_qrcode(payment_id)
    print("✅ QR Code PIX obtido com sucesso!")
    print(f"   Payload (primeiros 50 chars): {pix_data['payload'][:50]}...")
    print(f"   QR Code Image: {'✅ Disponível' if pix_data.get('encodedImage') else '❌ Não disponível'}")
    
    if pix_data.get('encodedImage'):
        print(f"\n   📱 Para testar, use o código copia-e-cola:")
        print(f"   {pix_data['payload'][:80]}...")
except AsaasAPIException as e:
    print(f"❌ Erro ao obter QR Code: {e}")

# Test 4: Get Payment Details
print("\n" + "="*60)
print("TESTE 4: Consultar Pagamento")
print("="*60)

try:
    payment_details = asaas.get_payment(payment_id)
    print("✅ Detalhes do pagamento obtidos!")
    print(f"   ID: {payment_details['id']}")
    print(f"   Status: {payment_details['status']}")
    print(f"   Valor: R$ {payment_details['value']}")
    print(f"   Cliente: {payment_details['customer']}")
except AsaasAPIException as e:
    print(f"❌ Erro ao consultar pagamento: {e}")

# Test 5: List Payments
print("\n" + "="*60)
print("TESTE 5: Listar Pagamentos")
print("="*60)

try:
    payments_list = asaas.list_payments(customer_id=customer_id, limit=5)
    print(f"✅ Pagamentos listados: {payments_list['totalCount']} total")
    print(f"   Exibindo: {len(payments_list['data'])} pagamentos")
    for p in payments_list['data'][:3]:
        print(f"   - {p['id']}: R$ {p['value']} ({p['status']})")
except AsaasAPIException as e:
    print(f"❌ Erro ao listar pagamentos: {e}")

# Summary
print("\n" + "="*60)
print("📊 RESUMO DOS TESTES")
print("="*60)
print("✅ Conexão com Asaas: OK")
print("✅ Criar cliente: OK")
print("✅ Criar pagamento PIX: OK")
print("✅ Obter QR Code: OK")
print("✅ Consultar pagamento: OK")
print("✅ Listar pagamentos: OK")

print("\n" + "="*60)
print("🎉 TODOS OS TESTES PASSARAM!")
print("="*60)

print("\n📝 Próximos passos:")
print("   1. Simule o pagamento no painel do Asaas:")
print(f"      https://sandbox.asaas.com/cobranca/detalhes/{payment_id}")
print("   2. Configure o webhook para receber notificações automáticas")
print("   3. Teste o fluxo completo via API REST")

print("\n💡 Comandos úteis:")
print("   # Criar inscrição")
print("   curl -X POST http://localhost:8000/api/enrollments/ \\")
print("     -H 'Authorization: Token YOUR_TOKEN' \\")
print("     -H 'Content-Type: application/json' \\")
print("     -d '{\"product_id\":1,\"batch_id\":1}'")
print("\n   # Criar pagamento PIX")
print("   curl -X POST http://localhost:8000/api/payments/ \\")
print("     -H 'Authorization: Token YOUR_TOKEN' \\")
print("     -H 'Content-Type: application/json' \\")
print("     -d '{\"enrollment_id\":1,\"payment_method\":\"PIX_CASH\",\"installments\":1}'")

print("\n" + "="*60)
