# Modelos Criados - Sistema de Inscrição

## ✅ Modelos Implementados

### 1. **User & UserProfile** (apps/users/)
- User customizado com email como username
- UserProfile com campos: phone, cpf, asaas_customer_id
- Integração com django-allauth para Google OAuth

### 2. **Product** (apps/products/)
- Representa produto/curso/evento
- Campos: name, description, image, base_price, max_installments
- Método: `get_active_batch()` - retorna lote ativo

### 3. **Batch** (apps/products/)
- Representa lote com preço e desconto específico
- Campos: product, name, start_date, end_date, price, pix_discount_percentage, max_enrollments, status
- Status: SCHEDULED, ACTIVE, FULL, ENDED
- Métodos:
  - `calculate_pix_price()` - calcula preço com desconto PIX
  - `is_full` - verifica se atingiu limite de vagas
  - `is_active_now` - verifica se está ativo por data
  - Auto-atualização de status no save()

### 4. **Enrollment** (apps/enrollments/)
- Representa inscrição de usuário em produto/lote
- Campos: user, product, batch, form_data, status, payment_method, installments
- Valores: total_amount, discount_amount, final_amount
- Status: PENDING_PAYMENT, PAID, CANCELLED, EXPIRED
- Métodos de pagamento: PIX_CASH, PIX_INSTALLMENT, CREDIT_CARD
- Método: `calculate_amounts()` - calcula valores com desconto

### 5. **Payment** (apps/payments/)
- Representa transação de pagamento via Asaas
- Campos: enrollment, asaas_payment_id, asaas_subscription_id, installment_number, amount, status
- Campos PIX: pix_qr_code, pix_copy_paste, payment_url
- Status: CREATED, PENDING, CONFIRMED, RECEIVED, OVERDUE, REFUNDED, CANCELLED
- Campo de auditoria: raw_webhook_data (JSON)

## 📊 Relacionamentos

```
User (1) -----> (N) Enrollment
Product (1) ---> (N) Batch
Product (1) ---> (N) Enrollment
Batch (1) -----> (N) Enrollment
Enrollment (1) -> (N) Payment
```

## 🎯 Funcionalidades Implementadas

### Descontos
- ✅ Desconto PIX configurável por lote
- ✅ Cálculo automático no método `calculate_amounts()` do Enrollment
- ✅ Aplicado apenas para PIX à vista

### Parcelamento
- ✅ Suporte para 1-8 parcelas (configurável por produto)
- ✅ Campo `installments` no Enrollment
- ✅ Campo `installment_number` no Payment (para PIX parcelado)
- ✅ Propriedade `installment_value` calcula valor por parcela

### Status Automáticos
- ✅ Batch atualiza status automaticamente (SCHEDULED → ACTIVE → FULL/ENDED)
- ✅ Enrollment rastreia status do pagamento
- ✅ Payment rastreia cada transação individual

### Auditoria
- ✅ Timestamps (created_at, updated_at, paid_at)
- ✅ admin_notes no Enrollment
- ✅ raw_webhook_data no Payment
- ✅ Índices de banco para performance

## 🔧 Próximos Passos

### 1. Configurar PostgreSQL

Edite o arquivo `.env` e adicione:

```bash
DB_NAME=enrollment_db
DB_USER=postgres
DB_PASSWORD=sua_senha
DB_HOST=localhost
DB_PORT=5432
```

### 2. Criar banco de dados

```bash
# No terminal PostgreSQL
createdb enrollment_db

# Ou via psql
psql -U postgres
CREATE DATABASE enrollment_db;
\q
```

### 3. Executar migrações

```bash
cd backend
source venv/bin/activate
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```

### 4. Testar no Admin

```bash
python manage.py runserver
# Acesse: http://localhost:8000/admin/
```

## 📝 Próximas Implementações

1. **Admin Customizado** - Interfaces admin para gerenciar produtos, lotes, inscrições
2. **Serviço Asaas** - Integração com API do Asaas (criar cliente, pagamento, webhook)
3. **Endpoints API** - Views e serializers para inscrição e pagamento
4. **Webhooks** - Receber e processar eventos do Asaas
5. **Emails** - Notificações de confirmação, pagamento, etc.
6. **Frontend React** - Interface de inscrição e pagamento

## 🏗️ Arquitetura Clean Code

- ✅ Separação de responsabilidades (models, views, serializers, services)
- ✅ Nomes descritivos e em português para campos do usuário
- ✅ Docstrings em todas as classes e métodos
- ✅ Validações no nível do modelo
- ✅ Properties para lógica de negócio
- ✅ Métodos auxiliares para cálculos
- ✅ Índices de banco para queries frequentes
