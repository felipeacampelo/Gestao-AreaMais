# 🔔 Configuração de Webhook Asaas

## 📡 URL do Webhook

**URL Pública (ngrok):** `https://76d83bab182d.ngrok-free.app/api/payments/webhooks/asaas/`

⚠️ **Importante:** Esta URL muda toda vez que o ngrok reinicia. Use a URL atual do terminal.

---

## 🔧 Passo a Passo - Configurar no Asaas

### 1. Acessar Painel Asaas
- Acesse: **https://sandbox.asaas.com/**
- Faça login

### 2. Ir para Webhooks
- No menu lateral, clique em **"Integrações"**
- Clique em **"Webhooks"**

### 3. Adicionar Webhook
- Clique em **"Adicionar webhook"**

### 4. Configurar
Preencha os campos:

**URL do Webhook:**
```
https://76d83bab182d.ngrok-free.app/api/payments/webhooks/asaas/
```

**Eventos a serem notificados:**
Selecione todos os eventos de pagamento:
- ✅ PAYMENT_CREATED
- ✅ PAYMENT_UPDATED
- ✅ PAYMENT_CONFIRMED
- ✅ PAYMENT_RECEIVED
- ✅ PAYMENT_OVERDUE
- ✅ PAYMENT_REFUNDED
- ✅ PAYMENT_DELETED
- ✅ PAYMENT_RESTORED
- ✅ PAYMENT_AWAITING_RISK_ANALYSIS
- ✅ PAYMENT_APPROVED_BY_RISK_ANALYSIS
- ✅ PAYMENT_REPROVED_BY_RISK_ANALYSIS

**Token de autenticação (opcional):**
```
webhook_secret_123
```

### 5. Salvar
- Clique em **"Salvar"**
- ✅ Webhook configurado!

---

## 🧪 Testar Webhook

### Opção 1: Simular Pagamento no Painel

1. Vá em **"Cobranças"**
2. Encontre o pagamento: `pay_4iczg12dtj33vws8`
3. Clique em **"..."** (menu)
4. Selecione **"Simular pagamento"**
5. Confirme
6. ✅ Webhook será disparado automaticamente!

### Opção 2: Via API
```bash
curl -X POST https://sandbox.asaas.com/api/v3/payments/pay_4iczg12dtj33vws8/receiveInCash \
  -H "access_token: $ASAAS_API_KEY"
```

---

## 📊 Monitorar Webhooks

### Ver Logs do Django
No terminal onde o `runserver` está rodando, você verá:
```
POST /api/payments/webhooks/asaas/ HTTP/1.1" 200
```

### Ver Logs do ngrok
Acesse: **http://localhost:4040**
- Interface web do ngrok
- Mostra todas as requisições
- Útil para debug

### Ver no Banco de Dados
```bash
# Verificar status do pagamento
python manage.py shell
>>> from apps.payments.models import Payment
>>> p = Payment.objects.get(id=1)
>>> print(f"Status: {p.status}, Paid at: {p.paid_at}")
```

---

## 🔍 Verificar se Funcionou

### 1. Status do Pagamento
```bash
curl http://localhost:8000/api/payments/1/ \
  -H "Authorization: Token adf1ac77663ea2b58e3274088e96e4d9f3f7f7fb" \
  | python -m json.tool
```

**Antes do webhook:**
```json
{
  "status": "PENDING",
  "paid_at": null
}
```

**Depois do webhook:**
```json
{
  "status": "RECEIVED",
  "paid_at": "2025-10-28T16:10:00Z"
}
```

### 2. Status da Inscrição
```bash
curl http://localhost:8000/api/enrollments/3/ \
  -H "Authorization: Token adf1ac77663ea2b58e3274088e96e4d9f3f7f7fb" \
  | python -m json.tool
```

**Depois do webhook:**
```json
{
  "status": "PAID",
  "paid_at": "2025-10-28T16:10:00Z"
}
```

---

## 🐛 Troubleshooting

### Webhook não chega
1. **Verificar URL do ngrok**
   ```bash
   curl http://localhost:4040/api/tunnels | python -m json.tool
   ```

2. **Testar endpoint manualmente**
   ```bash
   curl -X POST https://76d83bab182d.ngrok-free.app/api/payments/webhooks/asaas/ \
     -H "Content-Type: application/json" \
     -H "asaas-access-token: webhook_secret_123" \
     -d '{
       "event": "PAYMENT_RECEIVED",
       "payment": {
         "id": "pay_4iczg12dtj33vws8",
         "status": "RECEIVED"
       }
     }'
   ```

3. **Ver logs do Django**
   - Terminal do runserver deve mostrar a requisição

### Erro 401 Unauthorized
- Verifique o token no header: `asaas-access-token`
- Deve ser igual ao configurado no `.env`: `ASAAS_WEBHOOK_TOKEN`

### Erro 404 Not Found
- Verifique a URL: `/api/payments/webhooks/asaas/`
- Certifique-se que termina com `/`

---

## 📝 Payload do Webhook

Exemplo de payload que o Asaas envia:

```json
{
  "event": "PAYMENT_RECEIVED",
  "payment": {
    "object": "payment",
    "id": "pay_4iczg12dtj33vws8",
    "dateCreated": "2025-10-28",
    "customer": "cus_000007169842",
    "subscription": null,
    "installment": null,
    "paymentLink": null,
    "dueDate": "2025-10-31",
    "value": 900.00,
    "netValue": 897.18,
    "billingType": "PIX",
    "status": "RECEIVED",
    "description": "Inscrição - Curso de Python Avançado",
    "externalReference": "3",
    "confirmedDate": "2025-10-28",
    "paymentDate": "2025-10-28",
    "clientPaymentDate": "2025-10-28",
    "installmentNumber": null,
    "invoiceUrl": "https://sandbox.asaas.com/i/4iczg12dtj33vws8",
    "invoiceNumber": "00000001",
    "transactionReceiptUrl": null,
    "nossoNumero": "000000001",
    "bankSlipUrl": null,
    "lastInvoiceViewedDate": null,
    "lastBankSlipViewedDate": null,
    "discount": {
      "value": 0.00,
      "dueDateLimitDays": 0
    },
    "fine": {
      "value": 0.00
    },
    "interest": {
      "value": 0.00
    },
    "deleted": false,
    "postalService": false
  }
}
```

---

## ✅ Checklist

- [ ] ngrok rodando
- [ ] URL do ngrok copiada
- [ ] Webhook configurado no Asaas
- [ ] Token configurado
- [ ] Eventos selecionados
- [ ] Pagamento simulado
- [ ] Webhook recebido
- [ ] Status atualizado no banco
- [ ] Inscrição marcada como paga

---

## 🎯 Resultado Esperado

Após simular o pagamento:

1. **Asaas** envia webhook para sua URL
2. **Endpoint** `/api/payments/webhooks/asaas/` recebe
3. **PaymentService** processa o evento
4. **Payment** status muda para `RECEIVED`
5. **Payment** `paid_at` é preenchido
6. **Enrollment** status muda para `PAID`
7. **Enrollment** `paid_at` é preenchido

✅ **Sistema completo funcionando!**
