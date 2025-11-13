# Guia de Diagnóstico de Email

## 1. Verificar Configuração Atual

**Endpoint:** `GET /api/users/email-config/`

**Requisitos:** Precisa estar logado como admin

**Exemplo (curl):**
```bash
curl -X GET https://seu-dominio.com/api/users/email-config/ \
  -H "Authorization: Token SEU_TOKEN_ADMIN"
```

**O que verificar:**
- `EMAIL_BACKEND` deve ser `django.core.mail.backends.smtp.EmailBackend`
- `EMAIL_HOST` deve ser `smtp.gmail.com` (ou seu provedor)
- `EMAIL_PORT` deve ser `587`
- `EMAIL_USE_TLS` deve ser `true`
- `EMAIL_HOST_USER` deve estar preenchido
- `EMAIL_HOST_PASSWORD` deve mostrar `***` (não vazio)
- `DEFAULT_FROM_EMAIL` deve estar preenchido

---

## 2. Testar Envio de Email

**Endpoint:** `POST /api/users/test-email/`

**Requisitos:** Precisa estar logado como admin

**Payload:**
```json
{
  "to_email": "seu-email@example.com"
}
```

**Exemplo (curl):**
```bash
curl -X POST https://seu-dominio.com/api/users/test-email/ \
  -H "Authorization: Token SEU_TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{"to_email":"seu-email@example.com"}'
```

**Resposta de sucesso:**
```json
{
  "success": true,
  "message": "Test email sent successfully to seu-email@example.com",
  "config": { ... }
}
```

**Resposta de erro:**
```json
{
  "success": false,
  "error": "Mensagem de erro detalhada",
  "config": { ... }
}
```

---

## 3. Variáveis de Ambiente no Railway

Certifique-se de que estas variáveis estão configuradas:

```bash
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=seu-email@gmail.com
EMAIL_HOST_PASSWORD=sua-senha-de-app-do-gmail
DEFAULT_FROM_EMAIL=seu-email@gmail.com
```

### Como obter senha de app do Gmail:

1. Acesse: https://myaccount.google.com/apppasswords
2. Crie uma senha de app para "Mail"
3. Use essa senha (16 caracteres) no `EMAIL_HOST_PASSWORD`

---

## 4. Erros Comuns

### Erro: "SMTPAuthenticationError"
- **Causa:** Senha incorreta ou autenticação de 2 fatores não configurada
- **Solução:** Use senha de app do Gmail

### Erro: "Connection refused"
- **Causa:** Porta bloqueada ou host incorreto
- **Solução:** Verifique `EMAIL_HOST` e `EMAIL_PORT`

### Erro: "Timeout"
- **Causa:** Firewall bloqueando conexão SMTP
- **Solução:** Verifique se o Railway permite conexões SMTP na porta 587

### Email não chega
- **Causa:** Email pode estar na caixa de spam
- **Solução:** Verifique a pasta de spam

---

## 5. Alternativas ao Gmail

### SendGrid (Recomendado para produção)
```bash
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=SG.sua-api-key-aqui
DEFAULT_FROM_EMAIL=noreply@seu-dominio.com
```

### Mailgun
```bash
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=postmaster@seu-dominio.mailgun.org
EMAIL_HOST_PASSWORD=sua-senha-mailgun
DEFAULT_FROM_EMAIL=noreply@seu-dominio.com
```

---

## 6. Testando Localmente

Execute o script de teste:
```bash
cd backend
source venv/bin/activate
python test_email.py
```

Ou use o Django shell:
```bash
python manage.py shell
```

```python
from django.core.mail import send_mail
from django.conf import settings

send_mail(
    'Test Email',
    'This is a test email.',
    settings.DEFAULT_FROM_EMAIL,
    ['seu-email@example.com'],
    fail_silently=False,
)
```
