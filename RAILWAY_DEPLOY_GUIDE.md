# 🚀 Guia de Deploy no Railway

## 📋 Pré-requisitos

- [x] Railway CLI instalado
- [x] Login feito: `railway login --browserless`
- [x] Conta Railway ativa

## 🎯 Arquitetura

**Deploy Separado (Opção A)**
- Backend (Django API) → Railway Service 1
- Frontend (React) → Railway Service 2
- PostgreSQL → Railway Database

---

## 🔧 PARTE 1: Deploy do Backend

### 1. Criar Projeto no Railway

```bash
cd backend
railway init
# Nome sugerido: areamais-backend
```

### 2. Adicionar PostgreSQL

No Railway Dashboard:
1. Clique no projeto
2. "+ New" → "Database" → "PostgreSQL"
3. Railway vai criar automaticamente a variável `DATABASE_URL`

### 3. Configurar Variáveis de Ambiente

No Railway Dashboard ou via CLI:

```bash
# Obrigatórias
railway variables set DJANGO_SECRET_KEY="seu-secret-key-super-seguro-aqui"
railway variables set DJANGO_DEBUG="False"
railway variables set DJANGO_ALLOWED_HOSTS="areamais-backend.up.railway.app,.railway.app"

# CORS
railway variables set CORS_ALLOWED_ORIGINS="https://areamais-frontend.up.railway.app"

# URLs
railway variables set FRONTEND_URL="https://areamais-frontend.up.railway.app"
railway variables set BACKEND_URL="https://areamais-backend.up.railway.app"

# Asaas (copie do seu .env local)
railway variables set ASAAS_API_KEY="sua-chave-asaas"
railway variables set ASAAS_WALLET_ID="seu-wallet-id"
railway variables set ASAAS_ENVIRONMENT="production"

# Google OAuth (se usar)
railway variables set GOOGLE_CLIENT_ID="seu-google-client-id"
railway variables set GOOGLE_CLIENT_SECRET="seu-google-client-secret"
```

### 4. Deploy do Backend

```bash
cd backend
railway up
```

### 5. Executar Migrações

```bash
railway run python manage.py migrate
railway run python manage.py createsuperuser
```

### 6. Testar Backend

```bash
railway open
# Acesse: https://seu-backend.up.railway.app/admin
```

---

## 🎨 PARTE 2: Deploy do Frontend

### 1. Criar Novo Serviço

```bash
cd ../frontend
railway init
# Nome sugerido: areamais-frontend
```

### 2. Configurar Variáveis de Ambiente

```bash
railway variables set REACT_APP_API_URL="https://areamais-backend.up.railway.app"
```

### 3. Criar `railway.json` no Frontend

Já criado automaticamente.

### 4. Deploy do Frontend

```bash
railway up
```

### 5. Testar Frontend

```bash
railway open
# Acesse: https://seu-frontend.up.railway.app
```

---

## ✅ Checklist Final

### Backend
- [ ] PostgreSQL conectado
- [ ] Variáveis de ambiente configuradas
- [ ] Migrações executadas
- [ ] Admin acessível
- [ ] API respondendo

### Frontend
- [ ] Build concluído
- [ ] Conectado ao backend
- [ ] Páginas carregando
- [ ] Login funcionando

### Integração
- [ ] CORS configurado corretamente
- [ ] Frontend consegue chamar API
- [ ] Autenticação funcionando
- [ ] Pagamentos testados (sandbox)

---

## 🔍 Comandos Úteis

```bash
# Ver logs
railway logs

# Ver status
railway status

# Abrir dashboard
railway open

# Executar comandos no servidor
railway run python manage.py <comando>

# Ver variáveis
railway variables

# Rollback
railway rollback
```

---

## 🐛 Troubleshooting

### Erro: "Application failed to respond"
- Verifique se o `PORT` está correto no Procfile
- Confirme que `gunicorn` está instalado

### Erro: "Database connection failed"
- Verifique se o PostgreSQL foi adicionado
- Confirme que `DATABASE_URL` está configurada

### Erro: "CORS policy"
- Adicione o domínio do frontend em `CORS_ALLOWED_ORIGINS`
- Verifique `ALLOWED_HOSTS`

### Erro: "Static files not found"
- Execute: `railway run python manage.py collectstatic --noinput`
- Verifique se `whitenoise` está instalado

---

## 📊 Monitoramento

- **Logs**: `railway logs --follow`
- **Métricas**: Railway Dashboard
- **Alertas**: Configurar no Railway

---

## 💰 Custos Estimados

**Plano Hobby (Grátis)**
- $5 de crédito/mês
- Suficiente para testes

**Plano Pro ($20/mês)**
- Melhor para produção
- Mais recursos
- Suporte prioritário

---

## 🔐 Segurança

- [ ] `DEBUG=False` em produção
- [ ] `SECRET_KEY` forte e único
- [ ] HTTPS habilitado (automático no Railway)
- [ ] Variáveis sensíveis no Railway (não no código)
- [ ] CORS configurado corretamente
- [ ] Rate limiting configurado

---

## 📝 Notas

- Railway faz deploy automático no push para `main`
- Pode configurar deploy automático do GitHub
- Backup do banco de dados recomendado
- Monitorar uso de recursos

---

**Criado em:** 04/11/2025
**Versão:** 1.0
