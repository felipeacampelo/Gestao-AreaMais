# Serviço de Integração Asaas

## ✅ Implementado

Criei dois serviços com clean architecture para integração com Asaas:

### 1. **AsaasService** (`apps/payments/services/asaas_service.py`)

Serviço de baixo nível que faz chamadas diretas à API do Asaas.

#### Métodos Implementados:

**Clientes:**
- `create_customer()` - Cria cliente no Asaas
- `get_customer()` - Busca dados do cliente

**Pagamentos PIX:**
- `create_pix_payment()` - Cria cobrança PIX
- `get_pix_qrcode()` - Obtém QR Code e código copia-e-cola

**Pagamentos Cartão:**
- `create_credit_card_payment()` - Cria cobrança no cartão com parcelamento

**Assinaturas:**
- `create_subscription()` - Cria assinatura recorrente (para PIX parcelado)

**Gestão:**
- `get_payment()` - Busca detalhes do pagamento
- `cancel_payment()` - Cancela pagamento
- `refund_payment()` - Estorna pagamento
- `list_payments()` - Lista pagamentos com filtros

#### Características:
- ✅ Suporta sandbox e produção
- ✅ Headers de autenticação automáticos
- ✅ Tratamento de erros com `AsaasAPIException`
- ✅ Timeout de 30 segundos
- ✅ Usa httpx para requisições assíncronas

---

### 2. **PaymentService** (`apps/payments/services/payment_service.py`)

Serviço de alto nível que orquestra o fluxo completo de pagamento.

#### Métodos Implementados:

**Gestão de Cliente:**
- `ensure_customer_exists()` - Garante que usuário tem ID no Asaas
  - Cria automaticamente se não existir
  - Salva `asaas_customer_id` no UserProfile

**Criação de Pagamentos:**
- `create_pix_cash_payment()` - PIX à vista
  - Cria pagamento no Asaas
  - Obtém QR Code
  - Salva Payment local
  - Retorna Payment com todos os dados

- `create_pix_installment_payments()` - PIX parcelado (2-8x)
  - Cria múltiplos pagamentos PIX
  - Vencimentos mensais (30 dias de intervalo)
  - Cada parcela tem seu próprio QR Code
  - Retorna lista de Payments

- `create_credit_card_payment()` - Cartão de crédito
  - Suporta parcelamento nativo do Asaas
  - Aceita token de cartão do frontend
  - Pagamento imediato

**Processamento de Webhooks:**
- `process_webhook()` - Processa eventos do Asaas
  - Mapeia eventos para status locais
  - Atualiza Payment automaticamente
  - Atualiza Enrollment quando todos pagamentos confirmados
  - Eventos suportados:
    - `PAYMENT_CREATED`
    - `PAYMENT_CONFIRMED`
    - `PAYMENT_RECEIVED`
    - `PAYMENT_OVERDUE`
    - `PAYMENT_REFUNDED`
    - `PAYMENT_DELETED`

**Gestão:**
- `cancel_payment()` - Cancela no Asaas e localmente
- `refund_payment()` - Estorna pagamento
- `_update_enrollment_status()` - Atualiza status da inscrição

#### Características:
- ✅ Transações atômicas (`@transaction.atomic`)
- ✅ Sincronização Asaas ↔ Banco local
- ✅ Atualização automática de status
- ✅ Tratamento de erros
- ✅ Auditoria completa (raw_webhook_data)

---

## 🔄 Fluxo de Pagamento

### PIX à Vista
```python
from apps.payments.services import PaymentService

service = PaymentService()
payment = service.create_pix_cash_payment(enrollment, due_days=3)

# payment.pix_qr_code - QR Code em base64
# payment.pix_copy_paste - Código copia-e-cola
# payment.payment_url - URL da fatura
```

### PIX Parcelado
```python
payments = service.create_pix_installment_payments(enrollment, installments=4)

# Lista de 4 payments
# Cada um com seu QR Code
# Vencimentos: hoje+30, hoje+60, hoje+90, hoje+120
```

### Cartão de Crédito
```python
payment = service.create_credit_card_payment(
    enrollment,
    installments=3,
    credit_card_token='token_from_frontend'
)
```

---

## 📡 Webhooks

### Configuração no Asaas:
1. Acesse o painel Asaas
2. Vá em Configurações > Webhooks
3. Adicione a URL: `https://seu-dominio.com/api/payments/webhooks/asaas/`
4. Configure o token de autenticação

### Processamento:
```python
# No endpoint de webhook
service = PaymentService()
service.process_webhook(request.data)

# Atualiza automaticamente:
# - Payment.status
# - Payment.paid_at
# - Enrollment.status (se todos pagos)
# - Enrollment.paid_at
```

---

## 🔐 Variáveis de Ambiente

Adicione no `.env`:

```bash
# Asaas
ASAAS_API_KEY=your-api-key-here
ASAAS_ENV=sandbox  # ou 'production'
ASAAS_WEBHOOK_TOKEN=your-webhook-token
```

### Obter Credenciais:

**Sandbox:**
1. Acesse: https://sandbox.asaas.com/
2. Crie uma conta de testes
3. Vá em Integrações > API Key
4. Copie a chave

**Produção:**
1. Acesse: https://www.asaas.com/
2. Faça login na sua conta
3. Vá em Integrações > API Key
4. Copie a chave de produção

---

## 📊 Mapeamento de Status

### Asaas → Local

| Evento Asaas | Status Local |
|--------------|--------------|
| PAYMENT_CREATED | CREATED |
| PAYMENT_UPDATED | PENDING |
| PAYMENT_CONFIRMED | CONFIRMED |
| PAYMENT_RECEIVED | RECEIVED |
| PAYMENT_OVERDUE | OVERDUE |
| PAYMENT_REFUNDED | REFUNDED |
| PAYMENT_DELETED | CANCELLED |

### Status que marcam como "pago":
- `CONFIRMED`
- `RECEIVED`

---

## 🧪 Testando

### 1. Criar Cliente
```python
from apps.payments.services import AsaasService

asaas = AsaasService()
customer = asaas.create_customer(
    name='João Silva',
    email='joao@example.com',
    cpf_cnpj='12345678900',
    phone='11999999999'
)
print(customer['id'])  # Salvar no UserProfile
```

### 2. Criar Pagamento PIX
```python
payment = asaas.create_pix_payment(
    customer_id='cus_000000000000',
    value=Decimal('100.00'),
    due_date=date.today() + timedelta(days=3),
    description='Teste PIX'
)
print(payment['id'])

# Obter QR Code
pix = asaas.get_pix_qrcode(payment['id'])
print(pix['payload'])  # Código copia-e-cola
```

### 3. Simular Webhook (Sandbox)
No sandbox do Asaas, você pode simular eventos de webhook manualmente.

---

## 🚨 Tratamento de Erros

```python
from apps.payments.services import AsaasAPIException

try:
    payment = service.create_pix_cash_payment(enrollment)
except AsaasAPIException as e:
    # Erro na API do Asaas
    print(f'Erro Asaas: {e}')
except ValueError as e:
    # Erro de validação
    print(f'Erro: {e}')
```

---

## 📝 Próximos Passos

1. ✅ Serviço Asaas implementado
2. ⏳ Criar endpoints API REST para frontend
3. ⏳ Implementar webhook endpoint
4. ⏳ Testar integração no sandbox
5. ⏳ Configurar emails de notificação

---

## 🔗 Documentação Asaas

- API Docs: https://docs.asaas.com/
- Sandbox: https://sandbox.asaas.com/
- Webhooks: https://docs.asaas.com/reference/webhooks
