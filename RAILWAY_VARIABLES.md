# 🔧 Variáveis de Ambiente - Railway Dashboard

## 📋 Como Configurar

1. Acesse: https://railway.com/project/dd8917d4-13ed-422b-adc4-f8a7a0836e04
2. Clique no serviço **AreaMais** (backend)
3. Vá na aba **"Variables"**
4. Clique em **"+ New Variable"**
5. Adicione cada variável abaixo

---

## ✅ VARIÁVEIS OBRIGATÓRIAS

### 1. DJANGO_SECRET_KEY
```
Variable Name: DJANGO_SECRET_KEY
Value: zAAksKG8hGST36jNRUXml2HirOvRRlYeEfvRiEUPAZgynaRkQ8PO2HM12sBuLiVbzWM
```
**⚠️ IMPORTANTE:** Use a chave gerada acima ou gere uma nova com:
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(50))"
```

---

### 2. DJANGO_DEBUG
```
Variable Name: DJANGO_DEBUG
Value: False
```
**Nota:** Sempre `False` em produção!

---

### 3. DJANGO_ALLOWED_HOSTS
```
Variable Name: DJANGO_ALLOWED_HOSTS
Value: www.areamais.com.br,areamais.com.br,.railway.app
```
**✅ CONFIGURADO:** Backend será acessado via `www.areamais.com.br`

**Nota:** O `.railway.app` permite acesso temporário pela URL do Railway durante testes.

---

### 4. CORS_ALLOWED_ORIGINS
```
Variable Name: CORS_ALLOWED_ORIGINS
Value: https://areamais.up.railway.app,http://localhost:3000
```
**✅ CONFIGURADO:** Frontend em `areamais.up.railway.app`

**Nota:** `localhost:3000` é para desenvolvimento local.

---

### 5. FRONTEND_URL
```
Variable Name: FRONTEND_URL
Value: https://areamais.up.railway.app
```
**✅ CONFIGURADO:** URL do frontend no Railway.

---

### 6. BACKEND_URL
```
Variable Name: BACKEND_URL
Value: https://www.areamais.com.br
```
**✅ CONFIGURADO:** Domínio customizado do backend.

---

## 💳 VARIÁVEIS DO ASAAS (Pagamentos)

### 7. ASAAS_API_KEY
```
Variable Name: ASAAS_API_KEY
Value: [COPIAR DO SEU .env LOCAL]
```
**Como pegar:**
```bash
cat backend/.env | grep ASAAS_API_KEY
```

---

### 8. ASAAS_WALLET_ID
```
Variable Name: ASAAS_WALLET_ID
Value: [COPIAR DO SEU .env LOCAL]
```
**Como pegar:**
```bash
cat backend/.env | grep ASAAS_WALLET_ID
```

---

### 9. ASAAS_ENVIRONMENT
```
Variable Name: ASAAS_ENVIRONMENT
Value: production
```
**Nota:** Use `sandbox` para testes, `production` para produção real.

---

## 🔐 VARIÁVEIS OPCIONAIS (Google OAuth)

### 10. GOOGLE_CLIENT_ID
```
Variable Name: GOOGLE_CLIENT_ID
Value: [SEU GOOGLE CLIENT ID]
```

---

### 11. GOOGLE_CLIENT_SECRET
```
Variable Name: GOOGLE_CLIENT_SECRET
Value: [SEU GOOGLE CLIENT SECRET]
```

---

## 🗄️ DATABASE_URL

**NÃO PRECISA CONFIGURAR!**

O Railway cria automaticamente quando você adiciona o PostgreSQL:
```
Variable Name: DATABASE_URL
Value: postgresql://postgres:senha@host:5432/railway
```

---

## 📝 RESUMO - COPIAR E COLAR

### Mínimo para funcionar:

| Variable Name | Value |
|--------------|-------|
| `DJANGO_SECRET_KEY` | `zAAksKG8hGST36jNRUXml2HirOvRRlYeEfvRiEUPAZgynaRkQ8PO2HM12sBuLiVbzWM` |
| `DJANGO_DEBUG` | `False` |
| `DJANGO_ALLOWED_HOSTS` | `www.areamais.com.br,areamais.com.br,.railway.app` |
| `CORS_ALLOWED_ORIGINS` | `https://areamais.up.railway.app,http://localhost:3000` |
| `FRONTEND_URL` | `https://areamais.up.railway.app` |
| `BACKEND_URL` | `https://www.areamais.com.br` |
| `ASAAS_API_KEY` | `[sua-chave]` |
| `ASAAS_WALLET_ID` | `[seu-wallet]` |
| `ASAAS_ENVIRONMENT` | `sandbox` |

---

## ✅ Checklist

- [ ] Adicionar PostgreSQL no Railway
- [ ] Configurar todas as variáveis acima
- [ ] Atualizar `DJANGO_ALLOWED_HOSTS` com URL real
- [ ] Executar migrações: `railway run python manage.py migrate`
- [ ] Criar superuser: `railway run python manage.py createsuperuser`
- [ ] Testar acesso ao admin

---

## 🔍 Como Verificar se Está Funcionando

```bash
# Ver variáveis configuradas
railway variables

# Ver logs
railway logs

# Testar conexão
curl https://sua-url.railway.app/admin/
```

---

**Criado em:** 04/11/2025
