# Guia de Deploy no Railway

## 1. Preparação

### Backend - Criar arquivo de produção (opcional)
O Railway já usa as variáveis de ambiente, então não precisa criar arquivo separado.

## 2. Deploy do Backend (Django)

### 2.1. Criar Projeto no Railway
1. Acesse https://railway.app
2. Clique em "New Project"
3. Escolha "Deploy from GitHub repo"
4. Selecione o repositório: `felipeacampelo/Gestao-AreaMais`
5. Selecione a branch: `dev` (ou `main` quando estiver pronto)
6. Railway detecta automaticamente que é Django

### 2.2. Configurar Variáveis de Ambiente
No painel do Railway, vá em **Variables** e adicione:

```bash
# Django
DJANGO_SECRET_KEY=gere-uma-chave-secreta-forte-aqui
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=${{RAILWAY_PUBLIC_DOMAIN}},www.areamais.com.br,areamais.com.br

# Database (Railway cria automaticamente quando você adiciona PostgreSQL)
DATABASE_URL=${{DATABASE_URL}}

# CORS
CORS_ALLOWED_ORIGINS=https://www.areamais.com.br,https://areamais.com.br

# URLs
FRONTEND_URL=https://www.areamais.com.br
BACKEND_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}

# Asaas (PRODUÇÃO - não use sandbox!)
ASAAS_API_KEY=sua-chave-asaas-de-producao

# Google OAuth (se usar)
GOOGLE_CLIENT_ID=seu-google-client-id
GOOGLE_CLIENT_SECRET=seu-google-client-secret
```

**Como gerar DJANGO_SECRET_KEY:**
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### 2.3. Adicionar PostgreSQL
1. No projeto Railway, clique em "New"
2. Selecione "Database" → "PostgreSQL"
3. Railway cria automaticamente a variável `DATABASE_URL`

### 2.4. Configurar Build e Start
Railway detecta automaticamente, mas você pode adicionar no `railway.toml` (criar na raiz):

```toml
[build]
builder = "nixpacks"
buildCommand = "cd backend && pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate"

[deploy]
startCommand = "cd backend && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT"
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 10
```

**Adicionar gunicorn ao requirements.txt:**
```bash
# No arquivo backend/requirements.txt, adicione:
gunicorn==21.2.0
```

### 2.5. Domínio Customizado
1. No Railway, vá em "Settings" → "Domains"
2. Clique em "Custom Domain"
3. Adicione: `api.areamais.com.br` (ou o domínio que preferir)
4. Configure o DNS no seu provedor:
   - Tipo: `CNAME`
   - Nome: `api`
   - Valor: `seu-projeto.railway.app`

## 3. Deploy do Frontend (React/Vite)

### 3.1. Criar Serviço Separado
1. No mesmo projeto Railway, clique em "New"
2. Selecione "GitHub Repo" → mesmo repositório
3. Configure o **Root Directory**: `/frontend`

### 3.2. Configurar Variáveis de Ambiente
No serviço do frontend, adicione:

```bash
VITE_API_URL=https://api.areamais.com.br
VITE_ASAAS_PUBLIC_KEY=sua-chave-publica-asaas-producao
```

### 3.3. Configurar Build
Railway detecta Vite automaticamente, mas você pode criar `railway.toml` no frontend:

```toml
[build]
builder = "nixpacks"
buildCommand = "npm install && npm run build"

[deploy]
startCommand = "npm run preview -- --host 0.0.0.0 --port $PORT"
```

### 3.4. Domínio Customizado
1. No serviço frontend, vá em "Settings" → "Domains"
2. Adicione: `www.areamais.com.br`
3. Configure o DNS:
   - Tipo: `CNAME`
   - Nome: `www`
   - Valor: `seu-frontend.railway.app`

## 4. Configurar Webhook do Asaas

### 4.1. URL do Webhook
Depois do deploy do backend, a URL será:
```
https://api.areamais.com.br/api/payments/webhooks/asaas/
```

### 4.2. Configurar no Asaas (PRODUÇÃO)
1. Acesse: https://www.asaas.com/config/webhooks (NÃO sandbox!)
2. Adicione a URL do webhook
3. Selecione os eventos:
   - ✅ Pagamento recebido
   - ✅ Pagamento confirmado
   - ✅ Pagamento vencido
   - ✅ Pagamento reembolsado

### 4.3. Testar Webhook
Após configurar, faça um pagamento de teste e verifique os logs no Railway:
```bash
# No Railway, vá em "Deployments" → "View Logs"
```

## 5. Checklist Final

### Antes do Deploy:
- [ ] Commit e push de todas as mudanças
- [ ] Gerar nova `DJANGO_SECRET_KEY`
- [ ] Obter chaves Asaas de **PRODUÇÃO**
- [ ] Configurar domínios no DNS

### Após o Deploy:
- [ ] Verificar se backend está rodando
- [ ] Verificar se frontend está rodando
- [ ] Criar superusuário: `railway run python manage.py createsuperuser`
- [ ] Acessar admin: `https://api.areamais.com.br/admin`
- [ ] Criar produto e lote de teste
- [ ] Testar inscrição completa
- [ ] Testar pagamento PIX
- [ ] Verificar se webhook está funcionando

## 6. Comandos Úteis no Railway

### Rodar comandos no backend:
```bash
# Criar superusuário
railway run python manage.py createsuperuser

# Fazer migrações
railway run python manage.py migrate

# Coletar arquivos estáticos
railway run python manage.py collectstatic

# Shell Django
railway run python manage.py shell
```

### Ver logs em tempo real:
```bash
railway logs
```

## 7. Troubleshooting

### Backend não inicia:
- Verifique os logs no Railway
- Confirme que `DATABASE_URL` está configurado
- Verifique se `gunicorn` está no requirements.txt

### Frontend não carrega:
- Verifique se `VITE_API_URL` está correto
- Teste a API diretamente: `https://api.areamais.com.br/api/products/`

### Webhook não funciona:
- Verifique se a URL está correta no Asaas
- Veja os logs do backend no Railway
- Teste manualmente: `curl -X POST https://api.areamais.com.br/api/payments/webhooks/asaas/`

### Erro de CORS:
- Verifique `CORS_ALLOWED_ORIGINS` no backend
- Adicione o domínio do frontend

## 8. Segurança

### ⚠️ IMPORTANTE:
- ✅ Use `DEBUG=False` em produção
- ✅ Use chaves Asaas de PRODUÇÃO (não sandbox)
- ✅ Nunca commite arquivos `.env`
- ✅ Use HTTPS em todos os domínios
- ✅ Configure `ALLOWED_HOSTS` corretamente
- ✅ Mantenha `SECRET_KEY` segura

## 9. Backup

### Backup do banco de dados:
```bash
# No Railway, vá no serviço PostgreSQL
# Clique em "Data" → "Backup"
```

### Backup manual:
```bash
railway run pg_dump $DATABASE_URL > backup.sql
```

## 10. Monitoramento

### Railway fornece:
- 📊 Métricas de uso (CPU, RAM, Network)
- 📝 Logs em tempo real
- 🔔 Alertas de erro
- 📈 Uptime monitoring

Acesse em: **Deployments** → **Metrics**

---

## Resumo Rápido

1. **Backend**: Deploy do Django com PostgreSQL
2. **Frontend**: Deploy do React/Vite
3. **Variáveis**: Configure no painel do Railway
4. **Domínios**: Configure DNS e adicione no Railway
5. **Webhook**: Configure no Asaas com URL de produção
6. **Teste**: Faça uma inscrição completa para validar

🚀 **Pronto para produção!**
