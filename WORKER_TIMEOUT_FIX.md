# Fix: Worker Timeout no Railway

## Problema
```
[CRITICAL] WORKER TIMEOUT (pid:5)
[ERROR] Worker (pid:5) exited with code 1
```

## Causa
O worker do Gunicorn estava sendo killado por timeout (30s padrão) devido a:
1. **Envio de email síncrono** na criação de enrollment (operação bloqueante)
2. **Timeout muito curto** para operações que podem demorar

## Soluções Implementadas

### 1. Comentado envio de email síncrono
**Arquivo:** `backend/apps/enrollments/views.py`

O envio de email estava bloqueando o worker. Comentado temporariamente até implementar background tasks (Celery/RQ).

### 2. Aumentado timeout do Gunicorn
**Arquivo:** `backend/gunicorn.conf.py` (novo)

Configurações:
- **Timeout:** 120 segundos (era 30s)
- **Workers:** 2 (ajustável via `WEB_CONCURRENCY`)
- **Graceful timeout:** 30 segundos
- **Max requests:** 1000 (previne memory leaks)

### 3. Atualizado Procfile
**Arquivo:** `backend/Procfile`

Agora usa o arquivo de configuração do Gunicorn.

## Deploy

```bash
git add .
git commit -m "fix: resolve worker timeout no Railway"
git push
```

O Railway vai fazer redeploy automaticamente.

## Verificação

1. **Aguarde o deploy completar** (1-2 minutos)
2. **Verifique os logs:**
   ```bash
   railway logs
   ```
   Não deve mais aparecer "WORKER TIMEOUT"

3. **Teste a API:**
   ```
   https://gestao-areamais-production.up.railway.app/api/products/
   ```

4. **Teste criar enrollment** no frontend

## Próximos Passos (Futuro)

### Implementar Background Tasks
Para envio de emails sem bloquear o worker:

**Opção 1: Django-RQ (mais simples)**
```bash
pip install django-rq
```

**Opção 2: Celery (mais robusto)**
```bash
pip install celery redis
```

### Exemplo com Django-RQ:
```python
# tasks.py
import django_rq

@django_rq.job
def send_enrollment_email(enrollment_id):
    enrollment = Enrollment.objects.get(id=enrollment_id)
    send_enrollment_confirmation_email(enrollment)

# views.py
from .tasks import send_enrollment_email

def create(self, request, *args, **kwargs):
    # ... criar enrollment ...
    
    # Envia email em background
    send_enrollment_email.delay(enrollment.id)
    
    return Response(...)
```

## Monitoramento

Adicione ao Railway:
- **Variável:** `WEB_CONCURRENCY=2` (ajustar conforme necessário)
- **Logs:** Monitorar tempo de resposta das requisições
- **Alertas:** Configurar para worker timeout

## Troubleshooting

### Se o timeout persistir:
1. Verifique se há outras operações bloqueantes (chamadas API externas, queries lentas)
2. Aumente o timeout no `gunicorn.conf.py`
3. Adicione índices no banco de dados para queries lentas
4. Use `django-debug-toolbar` localmente para identificar queries N+1

### Se o site ficar lento:
1. Aumente o número de workers: `WEB_CONCURRENCY=4`
2. Considere usar worker class `gevent` ou `eventlet` para I/O assíncrono
3. Adicione cache (Redis) para queries frequentes
