# PC2-PFDC3 — Boilerplate Full-Stack

> Stack: Node.js/Express · PostgreSQL (Supabase) · React + Vite · Prisma ORM

## Estructura del Proyecto

```
PC2-PFDC3/
├── backend/                    # Servidor Express (Node.js)
│   ├── config/
│   │   └── database.js         # Conexión a PostgreSQL con Prisma
│   ├── prisma/
│   │   └── schema.prisma       # Schema de base de datos
│   ├── src/
│   │   ├── routes/             # [ESPACIO] Routers de la API REST
│   │   ├── controllers/        # [ESPACIO] Controladores (Request/Response)
│   │   ├── services/           # [ESPACIO] Lógica de negocio
│   │   ├── repositories/       # [ESPACIO] Acceso a datos con Prisma
│   │   ├── middlewares/        # [ESPACIO] Middlewares (auth, validate)
│   │   └── utils/
│   │       └── logger.js       # Logger Winston
│   ├── tests/                  # [ESPACIO] Tests con Jest + Supertest
│   ├── logs/                   # Archivos de log (gitignored)
│   ├── .env.example            # Plantilla de variables de entorno
│   ├── package.json
│   └── server.js               # Punto de entrada del servidor
│
├── frontend/                   # Cliente React + Vite
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js        # Instancia Axios con interceptores JWT
│   │   ├── components/         # [ESPACIO] Componentes React
│   │   ├── pages/              # [ESPACIO] Páginas/Vistas
│   │   ├── hooks/              # [ESPACIO] Custom Hooks
│   │   ├── context/            # [ESPACIO] React Context (Auth, etc.)
│   │   └── utils/              # [ESPACIO] Utilidades del frontend
│   ├── .env.example
│   └── package.json
│
├── scripts/                    # Automatización
│   ├── jira_automator.py       # Script para crear Épicas e Historias en Jira
│   ├── epics_and_stories.json  # Backlog Scrum genérico
│   ├── skill_jira_contextualizer.txt   # Prompt para generar el JSON con IA
│   └── skill_modificar_sustento.txt    # Prompt para contextualizar el sustento
│
├── docs/                       # Documentación del proyecto
│   ├── informe-pc2.md          # Plantilla del informe de evaluación
│   └── sustento_arquitectura.md # Justificación técnica de arquitectura
│
├── .github/
│   └── workflows/
│       └── deploy.yml          # Pipeline CI/CD (GitHub Actions)
│
├── .gitignore
└── README.md                   # Este archivo
```

## Inicio Rápido

### 1. Backend

```bash
cd backend
cp .env.example .env
# Editar .env con tus credenciales de Supabase y JWT secret

npm install
npx prisma generate
npx prisma migrate dev --name init

npm run dev
# → http://localhost:3001
# → Health Check: http://localhost:3001/api/health
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env
# Editar .env: VITE_API_URL=http://localhost:3001/api/v1

npm install
npm run dev
# → http://localhost:5173
```

### 3. Scripts Jira (Python)

```bash
cd scripts
pip install requests python-dotenv

# Crear .env en la raíz del proyecto con:
# JIRA_DOMAIN=tu-empresa.atlassian.net
# JIRA_EMAIL=tu-email@empresa.com
# JIRA_API_TOKEN=tu-token
# JIRA_PROJECT_KEY=PC2

# Dry run (simular sin crear nada):
python jira_automator.py --dry-run

# Ejecución real:
python jira_automator.py
```

## Branching Strategy

```
main        → Producción (protegida)
develop     → Staging (integración)
feature/*   → Historias de usuario
hotfix/*    → Correcciones urgentes
```

## Pipeline CI/CD

Push a `develop` → CI (Lint + Test) → Deploy Staging  
Push a `main`    → CI (Lint + Test + Security) → Deploy Producción

## Skills Disponibles (para el examen)

| Archivo | Uso |
|---------|-----|
| `scripts/skill_jira_contextualizer.txt` | Generar el `epics_and_stories.json` con IA a partir del caso de negocio |
| `scripts/skill_modificar_sustento.txt` | Adaptar `docs/sustento_arquitectura.md` al contexto de negocio específico |

## Variables de Entorno Críticas

| Variable | Ubicación | Descripción |
|----------|-----------|-------------|
| `DATABASE_URL` | `backend/.env` | Conexión PostgreSQL (Supabase) |
| `JWT_SECRET` | `backend/.env` | Secreto de firma JWT (64 bytes) |
| `FRONTEND_URL` | `backend/.env` | URL del frontend (CORS) |
| `VITE_API_URL` | `frontend/.env` | URL del backend para Axios |
| `JIRA_*` | `.env` raíz | Credenciales Jira para scripts |
