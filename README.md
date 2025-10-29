# Sistema de Inscrição

Sistema de inscrição com backend em Django e frontend em React.

## Estrutura do Projeto

```
windsurf-project/
├── backend/           # Aplicação Django
└── frontend/          # Aplicação React
```

## Pré-requisitos

- Python 3.8+
- Node.js 14+
- pip (gerenciador de pacotes Python)
- npm (gerenciador de pacotes Node.js)

## Configuração do Ambiente

### Backend (Django)

1. Navegue até a pasta `backend`
2. Crie um ambiente virtual: `python -m venv venv`
3. Ative o ambiente virtual:
   - Windows: `.\venv\Scripts\activate`
   - Unix/MacOS: `source venv/bin/activate`
4. Instale as dependências: `pip install -r requirements.txt`
5. Execute as migrações: `python manage.py migrate`
6. Inicie o servidor: `python manage.py runserver`

### Frontend (React)

1. Navegue até a pasta `frontend`
2. Instale as dependências: `npm install`
3. Inicie o servidor de desenvolvimento: `npm start`

## Desenvolvimento

O backend estará disponível em: http://localhost:8000/
O frontend estará disponível em: http://localhost:3000/
