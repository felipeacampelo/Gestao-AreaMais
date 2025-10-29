# Setup do Backend - Sistema de Inscrição

## Passo 1: Criar ambiente virtual

```bash
cd backend
python -m venv venv
```

## Passo 2: Ativar ambiente virtual

**macOS/Linux:**
```bash
source venv/bin/activate
```

**Windows:**
```bash
.\venv\Scripts\activate
```

## Passo 3: Instalar dependências

```bash
pip install -r requirements.txt
```

## Passo 4: Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
- `DJANGO_SECRET_KEY`: Gere uma chave secreta
- `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`: Obtenha no Google Cloud Console
- `ASAAS_API_KEY`: Obtenha na sua conta Asaas

## Passo 5: Executar migrações

```bash
python manage.py makemigrations
python manage.py migrate
```

## Passo 6: Criar superusuário

```bash
python manage.py createsuperuser
```

## Passo 7: Iniciar servidor

```bash
python manage.py runserver
```

O servidor estará disponível em: http://localhost:8000/
Admin em: http://localhost:8000/admin/

## Estrutura Criada

### Apps
- **users**: Autenticação com Google, modelo User customizado
- **products**: Produtos/Cursos (a implementar)
- **enrollments**: Inscrições (a implementar)
- **payments**: Pagamentos via Asaas (a implementar)

### Endpoints Disponíveis

#### Autenticação
- `POST /api/auth/login/` - Login com email/senha
- `POST /api/auth/logout/` - Logout
- `POST /api/auth/registration/` - Registro
- `GET /api/auth/google/` - Login com Google (redirect)
- `GET /api/auth/me/` - Dados do usuário atual
- `PUT/PATCH /api/auth/me/` - Atualizar dados do usuário

## Próximos Passos

1. ✅ Autenticação e cadastro implementados
2. ⏳ Configurar Google OAuth no Google Cloud Console
3. ⏳ Implementar modelos de Produtos e Lotes
4. ⏳ Implementar modelos de Inscrições
5. ⏳ Implementar integração com Asaas
6. ⏳ Implementar webhooks
7. ⏳ Customizar Django Admin

## Configuração do Google OAuth

1. Acesse: https://console.cloud.google.com/
2. Crie um novo projeto ou selecione um existente
3. Vá em "APIs & Services" > "Credentials"
4. Crie "OAuth 2.0 Client ID"
5. Configure:
   - Application type: Web application
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: 
     - `http://localhost:8000/api/auth/google/callback/`
     - `http://localhost:3000`
6. Copie Client ID e Client Secret para o `.env`

## Testando a API

Use o Django Admin ou ferramentas como Postman/Insomnia para testar os endpoints.

### Exemplo: Login
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "senha123"}'
```

### Exemplo: Obter dados do usuário
```bash
curl -X GET http://localhost:8000/api/auth/me/ \
  -H "Authorization: Token YOUR_TOKEN_HERE"
```
