# API Endpoints - Sistema de Inscrição

## ✅ Endpoints Implementados

### Autenticação

**Base URL:** `/api/auth/`

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/login/` | Login com email/senha | Não |
| POST | `/logout/` | Logout | Sim |
| POST | `/registration/` | Registro de novo usuário | Não |
| GET | `/google/` | Login com Google (redirect) | Não |
| GET | `/me/` | Dados do usuário atual | Sim |
| PUT/PATCH | `/me/` | Atualizar dados do usuário | Sim |

---

### Produtos

**Base URL:** `/api/products/`

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/products/` | Listar produtos ativos | Não |
| GET | `/products/{id}/` | Detalhes do produto | Não |
| GET | `/products/{id}/batches/` | Lotes do produto | Não |
| GET | `/products/{id}/active_batch/` | Lote ativo do produto | Não |
| GET | `/batches/` | Listar lotes ativos | Não |
| GET | `/batches/{id}/` | Detalhes do lote | Não |

**Query Params:**
- `/batches/?product={id}` - Filtrar lotes por produto

---

### Inscrições

**Base URL:** `/api/enrollments/`

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/` | Listar minhas inscrições | Sim |
| POST | `/` | Criar nova inscrição | Sim |
| GET | `/{id}/` | Detalhes da inscrição | Sim |
| GET | `/{id}/payments/` | Pagamentos da inscrição | Sim |
| POST | `/{id}/cancel/` | Cancelar inscrição | Sim |

**POST `/` - Criar Inscrição:**
```json
{
  "product_id": 1,
  "batch_id": 1,
  "form_data": {
    "nome": "João Silva",
    "telefone": "11999999999",
    "cpf": "12345678900"
  }
}
```

**Response:**
```json
{
  "id": 1,
  "user_email": "joao@example.com",
  "product": {...},
  "batch": {...},
  "status": "PENDING_PAYMENT",
  "total_amount": "1000.00",
  "discount_amount": "100.00",
  "final_amount": "900.00",
  "created_at": "2025-10-28T12:00:00Z"
}
```

---

### Pagamentos

**Base URL:** `/api/payments/`

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/` | Listar meus pagamentos | Sim |
| POST | `/` | Criar pagamento | Sim |
| GET | `/{id}/` | Detalhes do pagamento | Sim |
| POST | `/calculate/` | Calcular valores | Sim |
| POST | `/webhooks/asaas/` | Webhook Asaas | Não |

**POST `/calculate/` - Calcular Pagamento:**
```json
{
  "enrollment_id": 1,
  "payment_method": "PIX_CASH",
  "installments": 1
}
```

**Response:**
```json
{
  "original_amount": 1000.00,
  "discount_amount": 100.00,
  "final_amount": 900.00,
  "installments": 1,
  "installment_value": 900.00
}
```

**POST `/` - Criar Pagamento:**

**PIX à Vista:**
```json
{
  "enrollment_id": 1,
  "payment_method": "PIX_CASH",
  "installments": 1
}
```

**PIX Parcelado (4x):**
```json
{
  "enrollment_id": 1,
  "payment_method": "PIX_INSTALLMENT",
  "installments": 4
}
```

**Cartão de Crédito (3x):**
```json
{
  "enrollment_id": 1,
  "payment_method": "CREDIT_CARD",
  "installments": 3,
  "credit_card_token": "token_from_frontend"
}
```

**Response:**
```json
{
  "id": 1,
  "enrollment": {...},
  "asaas_payment_id": "pay_123456",
  "installment_number": 1,
  "amount": "900.00",
  "status": "PENDING",
  "due_date": "2025-10-31",
  "payment_url": "https://...",
  "pix_qr_code": "base64_image...",
  "pix_copy_paste": "00020126580014br.gov.bcb.pix...",
  "created_at": "2025-10-28T12:00:00Z"
}
```

---

## 🔄 Fluxo Completo

### 1. Listar Produtos
```bash
GET /api/products/
```

### 2. Ver Lote Ativo
```bash
GET /api/products/1/active_batch/
```

### 3. Criar Inscrição (requer login)
```bash
POST /api/enrollments/
{
  "product_id": 1,
  "batch_id": 1,
  "form_data": {"nome": "João"}
}
```

### 4. Calcular Valores
```bash
POST /api/payments/calculate/
{
  "enrollment_id": 1,
  "payment_method": "PIX_CASH",
  "installments": 1
}
```

### 5. Criar Pagamento
```bash
POST /api/payments/
{
  "enrollment_id": 1,
  "payment_method": "PIX_CASH",
  "installments": 1
}
```

### 6. Exibir QR Code PIX
```javascript
// Frontend
const payment = response.data;
<img src={`data:image/png;base64,${payment.pix_qr_code}`} />
<p>{payment.pix_copy_paste}</p>
```

### 7. Webhook Asaas Atualiza Status
```
POST /api/payments/webhooks/asaas/
(Asaas envia automaticamente)
```

### 8. Verificar Status
```bash
GET /api/enrollments/1/
# status: "PAID"
```

---

## 🔐 Autenticação

### Session-based (Cookie)
```bash
# Login
POST /api/auth/login/
{
  "email": "user@example.com",
  "password": "senha123"
}

# Cookie é setado automaticamente
# Requests subsequentes incluem cookie
```

### Token-based
```bash
# Login retorna token
{
  "key": "abc123token"
}

# Usar em requests
Authorization: Token abc123token
```

---

## 📊 Status

### Enrollment Status
- `PENDING_PAYMENT` - Aguardando pagamento
- `PAID` - Pago
- `CANCELLED` - Cancelado
- `EXPIRED` - Expirado

### Payment Status
- `CREATED` - Criado
- `PENDING` - Pendente
- `CONFIRMED` - Confirmado
- `RECEIVED` - Recebido
- `OVERDUE` - Vencido
- `REFUNDED` - Reembolsado
- `CANCELLED` - Cancelado

### Payment Methods
- `PIX_CASH` - PIX à vista (com desconto)
- `PIX_INSTALLMENT` - PIX parcelado (2-8x)
- `CREDIT_CARD` - Cartão de crédito (2-8x)

---

## 🧪 Testando com cURL

### Criar Inscrição
```bash
curl -X POST http://localhost:8000/api/enrollments/ \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": 1,
    "batch_id": 1,
    "form_data": {"nome": "João Silva"}
  }'
```

### Criar Pagamento PIX
```bash
curl -X POST http://localhost:8000/api/payments/ \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "enrollment_id": 1,
    "payment_method": "PIX_CASH",
    "installments": 1
  }'
```

---

## 🔧 Configuração CORS

Já configurado em `settings.py`:
```python
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
]
CORS_ALLOW_CREDENTIALS = True
```

---

## 📝 Próximos Passos

1. ✅ Endpoints criados
2. ⏳ Testar endpoints com Postman/Insomnia
3. ⏳ Configurar webhook no Asaas
4. ⏳ Criar frontend React
5. ⏳ Integrar frontend com API
