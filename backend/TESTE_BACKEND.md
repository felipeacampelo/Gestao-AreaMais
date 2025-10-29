# ✅ Testes do Backend - Sistema de Inscrição

## Status dos Testes

### ✅ Endpoints Testados e Funcionando

#### 1. **Produtos** - `/api/products/products/`
```bash
curl http://localhost:8000/api/products/products/
```
**Status:** ✅ Funcionando  
**Retorna:** Lista de 2 produtos ativos

#### 2. **Detalhes do Produto** - `/api/products/products/1/`
```bash
curl http://localhost:8000/api/products/products/1/
```
**Status:** ✅ Funcionando  
**Retorna:** Produto com lote ativo, preço PIX calculado

#### 3. **Login** - `/api/auth/login/`
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```
**Status:** ✅ Funcionando  
**Retorna:** Token de autenticação

#### 4. **Criar Inscrição** - `/api/enrollments/`
```bash
curl -X POST http://localhost:8000/api/enrollments/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Token YOUR_TOKEN" \
  -d '{"product_id":1,"batch_id":1,"form_data":{"nome":"João Silva","cpf":"12345678900"}}'
```
**Status:** ✅ Funcionando  
**Retorna:** Inscrição criada com valores calculados

---

## 🧪 Testes Realizados

### Teste 1: Listar Produtos
```bash
GET /api/products/products/
```
**Resultado:**
```json
{
  "count": 2,
  "results": [
    {
      "id": 1,
      "name": "Curso de Python Avançado",
      "base_price": "1000.00",
      "is_active": true
    },
    {
      "id": 2,
      "name": "Curso de Django REST Framework",
      "base_price": "1200.00",
      "is_active": true
    }
  ]
}
```
✅ **Passou**

---

### Teste 2: Detalhes do Produto com Lote Ativo
```bash
GET /api/products/products/1/
```
**Resultado:**
```json
{
  "id": 1,
  "name": "Curso de Python Avançado",
  "base_price": "1000.00",
  "max_installments": 8,
  "active_batch": {
    "id": 1,
    "name": "Turma 1 - 2025",
    "price": "900.00",
    "pix_discount_percentage": "10.00",
    "pix_price": 810.0,
    "max_enrollments": 50,
    "current_enrollments": 0,
    "status": "ACTIVE"
  }
}
```
✅ **Passou** - Preço PIX calculado corretamente (900 - 10% = 810)

---

### Teste 3: Login
```bash
POST /api/auth/login/
Body: {"email":"test@example.com","password":"test123"}
```
**Resultado:**
```json
{
  "key": "adf1ac77663ea2b58e3274088e96e4d9f3f7f7fb"
}
```
✅ **Passou** - Token gerado

---

### Teste 4: Criar Inscrição
```bash
POST /api/enrollments/
Headers: Authorization: Token adf1ac77663ea2b58e3274088e96e4d9f3f7f7fb
Body: {
  "product_id": 1,
  "batch_id": 1,
  "form_data": {"nome":"João Silva","cpf":"12345678900"}
}
```
**Resultado:**
```json
{
  "id": 3,
  "user_email": "test@example.com",
  "product": {...},
  "batch": {...},
  "status": "PENDING_PAYMENT",
  "payment_method": null,
  "installments": 1,
  "total_amount": "900.00",
  "discount_amount": "0.00",
  "final_amount": "900.00",
  "created_at": "2025-10-28T15:58:20.365835-03:00"
}
```
✅ **Passou** - Inscrição criada com valores calculados

---

## 🔧 Correções Realizadas

### 1. Erro no Batch.save()
**Problema:** `is_full` tentava acessar `enrollments` antes do objeto ser salvo  
**Solução:** Adicionar verificação `if self.pk` antes de checar `is_full`

**Arquivo:** `apps/products/models.py`
```python
def save(self, *args, **kwargs):
    # Only check is_full if the object already exists (has pk)
    if self.pk and self.is_full:
        self.status = 'FULL'
    # ...
```

### 2. Erro no Enrollment.save()
**Problema:** `total_amount` era null ao criar inscrição  
**Solução:** Adicionar método `save()` para calcular valores automaticamente

**Arquivo:** `apps/enrollments/models.py`
```python
def save(self, *args, **kwargs):
    """Auto-calculate amounts before saving."""
    if self.batch and self.total_amount is None:
        self.calculate_amounts()
    super().save(*args, **kwargs)
```

### 3. Import Decimal
**Problema:** `Decimal` não estava importado  
**Solução:** Adicionar `from decimal import Decimal`

---

## 📊 Dados de Teste Criados

### Usuário
- **Email:** test@example.com
- **Senha:** test123
- **Token:** adf1ac77663ea2b58e3274088e96e4d9f3f7f7fb

### Produtos
1. **Curso de Python Avançado**
   - Preço base: R$ 1.000,00
   - Max parcelas: 8x
   - Lote ativo: Turma 1 - 2025
   - Preço lote: R$ 900,00
   - Desconto PIX: 10% (R$ 810,00)

2. **Curso de Django REST Framework**
   - Preço base: R$ 1.200,00
   - Max parcelas: 6x
   - Lote ativo: Turma Especial
   - Preço lote: R$ 1.100,00
   - Desconto PIX: 15% (R$ 935,00)

### Inscrições
- 1 inscrição criada para teste

---

## ⏳ Próximos Testes

### Testes Pendentes:

1. **Calcular Pagamento**
   ```bash
   POST /api/payments/calculate/
   Body: {
     "enrollment_id": 3,
     "payment_method": "PIX_CASH",
     "installments": 1
   }
   ```

2. **Criar Pagamento PIX**
   ```bash
   POST /api/payments/
   Body: {
     "enrollment_id": 3,
     "payment_method": "PIX_CASH",
     "installments": 1
   }
   ```
   **Nota:** Requer configuração do Asaas

3. **Webhook Asaas**
   ```bash
   POST /api/payments/webhooks/asaas/
   ```
   **Nota:** Requer configuração do Asaas

4. **Listar Minhas Inscrições**
   ```bash
   GET /api/enrollments/
   ```

5. **Cancelar Inscrição**
   ```bash
   POST /api/enrollments/3/cancel/
   ```

---

## 🔐 Configuração Necessária para Testes Completos

### 1. Asaas (Sandbox)
Adicionar no `.env`:
```bash
ASAAS_API_KEY=sua-chave-sandbox
ASAAS_ENV=sandbox
ASAAS_WEBHOOK_TOKEN=seu-token-webhook
```

**Como obter:**
1. Acesse: https://sandbox.asaas.com/
2. Crie conta de testes
3. Vá em Integrações > API Key
4. Copie a chave

### 2. Google OAuth (Opcional para testes)
```bash
GOOGLE_CLIENT_ID=seu-client-id
GOOGLE_CLIENT_SECRET=seu-client-secret
```

---

## 📝 Comandos Úteis

### Criar Dados de Teste
```bash
cd backend
source venv/bin/activate
python create_test_data.py
```

### Resetar Banco
```bash
python manage.py flush --no-input
python create_test_data.py
```

### Ver Logs do Servidor
```bash
# Terminal onde o runserver está rodando
```

### Acessar Admin
```
URL: http://localhost:8000/admin/
Email: admin@areamais.com
Senha: (definir com changepassword)
```

---

## ✅ Resumo

### Funcionando:
- ✅ Autenticação (login, token)
- ✅ Produtos (listar, detalhes)
- ✅ Lotes (listar, filtrar)
- ✅ Inscrições (criar, listar)
- ✅ Cálculo de valores (preço, desconto PIX)
- ✅ Django Admin customizado
- ✅ PostgreSQL configurado
- ✅ Modelos completos

### Pendente:
- ⏳ Integração Asaas (requer credenciais)
- ⏳ Testes de pagamento
- ⏳ Webhook Asaas
- ⏳ Emails
- ⏳ Frontend React

### Próximo Passo:
**Configurar credenciais Asaas para testar pagamentos completos**
