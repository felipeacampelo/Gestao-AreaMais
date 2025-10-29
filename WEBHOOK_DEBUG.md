# Checklist para Webhook do Asaas Funcionar

## 1. Verificar se o ngrok está rodando
```bash
# Verificar se o ngrok está ativo
curl http://localhost:4040/api/tunnels
```

Se não estiver, iniciar:
```bash
ngrok http 8000
```

## 2. Pegar a URL do ngrok
A URL será algo como: `https://4f1415872acd.ngrok-free.app`

## 3. Configurar no Asaas

### URL do Webhook:
```
https://4f1415872acd.ngrok-free.app/api/payments/webhooks/asaas/
```

### Eventos que devem estar marcados:
- ✅ PAYMENT_CREATED
- ✅ PAYMENT_UPDATED  
- ✅ PAYMENT_CONFIRMED
- ✅ PAYMENT_RECEIVED
- ✅ PAYMENT_OVERDUE
- ✅ PAYMENT_DELETED
- ✅ PAYMENT_REFUNDED

## 4. Testar o Webhook

### Opção 1: Pelo painel do Asaas
1. Ir em Configurações → Webhooks
2. Clicar em "Testar Webhook"
3. Selecionar evento "PAYMENT_RECEIVED"
4. Enviar

### Opção 2: Confirmar um pagamento real
1. Criar uma inscrição
2. Gerar pagamento PIX
3. Confirmar o pagamento no painel do Asaas
4. Verificar os logs do backend

## 5. Verificar os Logs

### No terminal do backend:
Você deve ver:
```
[WEBHOOK] Received: {'event': 'PAYMENT_RECEIVED', ...}
[WEBHOOK] Processed successfully
```

### Se não aparecer nada:
- O Asaas não está enviando o webhook
- A URL está incorreta
- O ngrok expirou

## 6. Solução Temporária

Se o webhook não funcionar, use o comando manual:
```bash
cd backend
source venv/bin/activate
python manage.py sync_payments --all
```

## 7. Para Produção

Em produção, você precisará:
1. URL pública permanente (não ngrok)
2. Configurar no Asaas com essa URL
3. Ou configurar um cron job para rodar o sync_payments a cada 5 minutos

### Exemplo de cron job:
```bash
*/5 * * * * cd /path/to/backend && source venv/bin/activate && python manage.py sync_payments --all
```

## Troubleshooting

### Webhook não chega:
- Verificar se o ngrok está rodando
- Verificar se a URL no Asaas está correta
- Verificar se os eventos estão marcados

### Webhook chega mas dá erro:
- Verificar os logs do backend
- Verificar se o payment_id existe no banco

### Status não atualiza:
- Rodar `python manage.py sync_payments --all`
- Verificar se o pagamento tem asaas_payment_id
