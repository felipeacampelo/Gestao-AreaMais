# 🔐 Configuração Asaas Sandbox

## Passo 1: Criar Conta no Sandbox

1. Acesse: **https://sandbox.asaas.com/**
2. Clique em **"Criar conta grátis"**
3. Preencha os dados:
   - Nome completo
   - Email
   - CPF
   - Telefone
   - Senha
4. Confirme o email

## Passo 2: Obter API Key

1. Faça login no sandbox
2. No menu lateral, vá em **"Integrações"**
3. Clique em **"API Key"**
4. Copie a chave que aparece (formato: `$aact_YTU5YTE0M2M2N2I4MTliNzk0YTI5N2U5MzdjNWZmNDQ6OjAwMDAwMDAwMDAwMDAwNzg1NTY6OiRhYWNoXzI0ZGM4ZDQzLTNlZjAtNDFiZi1iNzE4LTQ0ZjQzNjY3NWE4Yg==`)

## Passo 3: Configurar Webhook (Opcional)

1. No menu **"Integrações"**, clique em **"Webhooks"**
2. Clique em **"Adicionar webhook"**
3. Configure:
   - **URL:** `http://seu-dominio.com/api/payments/webhooks/asaas/`
   - **Eventos:** Selecione todos os eventos de pagamento
   - **Token de autenticação:** Gere um token aleatório (ex: `webhook_secret_123`)
4. Salve

## Passo 4: Adicionar no .env

Edite o arquivo `.env` e adicione:

```bash
# Asaas Sandbox
ASAAS_API_KEY=$aact_SUA_CHAVE_AQUI
ASAAS_ENV=sandbox
ASAAS_WEBHOOK_TOKEN=webhook_secret_123
```

## Passo 5: Testar Conexão

Execute o script de teste:

```bash
cd backend
source venv/bin/activate
python test_asaas.py
```

---

## 🧪 Dados de Teste do Sandbox

O Asaas Sandbox aceita dados fictícios para testes:

### CPF de Teste
- **CPF válido:** `12345678909`
- Qualquer CPF válido funciona no sandbox

### Cartões de Teste

#### Aprovado
- **Número:** `5162306219378829`
- **CVV:** `318`
- **Validade:** Qualquer data futura

#### Negado
- **Número:** `5162306219378837`
- **CVV:** `318`
- **Validade:** Qualquer data futura

### PIX de Teste
- No sandbox, o PIX é gerado normalmente
- Você pode simular o pagamento manualmente no painel

---

## 📱 Simular Pagamento PIX no Sandbox

1. Crie um pagamento PIX via API
2. Acesse o painel do Asaas Sandbox
3. Vá em **"Cobranças"**
4. Encontre a cobrança criada
5. Clique em **"..."** > **"Simular pagamento"**
6. Confirme
7. O webhook será disparado automaticamente

---

## 🔧 Troubleshooting

### Erro: "Invalid API Key"
- Verifique se copiou a chave completa
- Certifique-se de estar usando a chave do **sandbox**, não de produção

### Erro: "Customer not found"
- O cliente é criado automaticamente na primeira requisição
- Verifique se o CPF está no formato correto (apenas números)

### Webhook não funciona
- No desenvolvimento local, use **ngrok** ou **localtunnel**:
  ```bash
  npx localtunnel --port 8000
  ```
- Use a URL gerada no webhook do Asaas

---

## 📚 Documentação Oficial

- **API Docs:** https://docs.asaas.com/
- **Sandbox:** https://sandbox.asaas.com/
- **Postman Collection:** https://docs.asaas.com/reference/postman

---

## ✅ Checklist

- [ ] Conta criada no sandbox
- [ ] API Key copiada
- [ ] `.env` configurado
- [ ] Teste de conexão executado
- [ ] Webhook configurado (opcional)
- [ ] Pagamento PIX testado
- [ ] Pagamento Cartão testado
