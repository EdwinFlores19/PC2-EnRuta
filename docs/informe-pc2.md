# Informe Técnico PC2 — [NOMBRE DEL PROYECTO]

> **Curso:** [Nombre del Curso]  
> **Docente:** [Nombre del Docente]  
> **Grupo:** [Número de Grupo]  
> **Integrantes:** [Nombres y Códigos]  
> **Fecha de Entrega:** [DD/MM/AAAA]  
> **Repositorio:** [URL GitHub]  
> **URL del Sistema en Producción:** [https://nombre-app.onrender.com]

---

## 1. Metodología DevOps y Stack Tecnológico

### 1.1 Metodología DevOps Adoptada

[COMPLETAR: Describir cómo se implementó la cultura DevOps. Incluir: integración continua con GitHub Actions, entrega continua hacia Render/Vercel, gestión del backlog en Jira con Scrum, estrategia de branching Git Flow, y automatización de tareas repetitivas con los agentes IA del ecosistema.]

La metodología DevOps implementada en este proyecto integra:

- **Control de versiones:** Git Flow con ramas `main`, `develop` y `feature/*`
- **Integración Continua:** GitHub Actions ejecuta lint, tests y build en cada push
- **Entrega Continua:** Deploy automático a Render (backend) y Vercel (frontend) al fusionar a `main`
- **Gestión ágil:** Scrum con sprints de 2 semanas, backlog en Jira, Daily Standups
- **Automatización agéntica:** Ecosystem de agentes IA especializados (Scrum Master, Arquitecto, Backend DBA, DevOps)

### 1.2 Justificación del Stack Tecnológico

#### Backend: Node.js con Express

[COMPLETAR: Justificar Node.js para el caso de negocio específico. Mencionar el Event Loop, I/O no bloqueante, alta concurrencia, ecosistema npm, y Express como framework minimalista.]

Ver documento completo: [docs/sustento_arquitectura.md](sustento_arquitectura.md)

#### Base de Datos: PostgreSQL (vía Supabase)

[COMPLETAR: Justificar PostgreSQL para el caso de negocio. Mencionar ACID, integridad referencial, normalización 3FN, y Supabase como proveedor gestionado exclusivamente de infraestructura de DB.]

#### Frontend: React con Vite

[COMPLETAR: Justificar React + Vite para el caso de negocio. Mencionar componentes reutilizables, Virtual DOM, React Router para SPA, y Vite para HMR instantáneo.]

---

## 2. Diagramas: Casos de Uso y Arquitectura

> 📌 **INSTRUCCIÓN PARA EL AGENTE ARQUITECTO:**  
> Inyectar el código Mermaid generado en cada bloque vacío a continuación.  
> Usar el MCP filesystem para leer y actualizar este archivo directamente.  
> Verificar el renderizado con el MCP Playwright.

### 2.1 Diagrama de Casos de Uso

```mermaid
%% [AGENTE ARQUITECTO: Inyectar diagrama de Casos de Uso aquí]
%% Activar el agente con: "Genera el diagrama de casos de uso para [CASO_DEL_EXAMEN]"
```

**Descripción:** [COMPLETAR: Descripción textual de actores y casos de uso principales]

### 2.2 Diagrama de Arquitectura Lógica

```mermaid
%% [AGENTE ARQUITECTO: Inyectar diagrama de Arquitectura Lógica aquí]
%% El diagrama debe mostrar: Presentación → Aplicación → Datos con todos los componentes reales
```

**Descripción:** [COMPLETAR: Descripción del flujo de datos entre capas]

### 2.3 Diagrama de Arquitectura Física en Nube

```mermaid
%% [AGENTE ARQUITECTO: Inyectar diagrama de Arquitectura Física aquí]
%% Mostrar: Vercel (Frontend) → Render (Backend Express) → Supabase (PostgreSQL)
%% Incluir: GitHub Actions CI/CD pipeline, Usuario Final, Internet
```

**Descripción:** [COMPLETAR: Descripción de los servicios cloud y sus interacciones]

### 2.4 Modelo Entidad-Relación

```mermaid
%% [AGENTE ARQUITECTO: Inyectar diagrama ER en 3FN aquí]
%% Basado en el schema de Prisma generado por el Agente Backend DBA
%% Incluir todas las entidades del caso de negocio con sus relaciones y cardinalidades
```

**Descripción del Modelo de Datos:** [COMPLETAR: Explicar las entidades, relaciones y decisiones de normalización]

---

## 3. Planificación con Scrum

### 3.1 Definición de Terminado (DoD)

Una Historia de Usuario se considera **TERMINADA** cuando:

| # | Criterio | Verificación |
|---|----------|-------------|
| 1 | Código implementado (backend + frontend) | Code review en PR |
| 2 | Tests pasando en verde (pipeline CI) | Screenshot GitHub Actions |
| 3 | Sin errores de lint (ESLint) | `npm run lint` exitoso |
| 4 | Criterios de aceptación verificados | Demo al Scrum Master |
| 5 | Endpoint documentado en el código | Comentarios JSDoc |
| 6 | Desplegado y verificado en staging | URL de staging funcionando |
| 7 | Story cerrada en Jira | Captura del tablero |

### 3.2 Sprint Goals

#### Sprint 1 — [DD/MM] al [DD/MM]

**Objetivo:** [COMPLETAR]

| Historia | Puntos | Estado |
|----------|--------|--------|
| [US-1.1 del backlog] | [pts] | 🟢 / 🟡 / 🔴 |
| [US-1.2 del backlog] | [pts] | 🟢 / 🟡 / 🔴 |
| **Total** | **[X]** | |

#### Sprint 2 — [DD/MM] al [DD/MM]

**Objetivo:** [COMPLETAR]

| Historia | Puntos | Estado |
|----------|--------|--------|
| [US-2.1 del backlog] | [pts] | 🟢 / 🟡 / 🔴 |
| **Total** | **[X]** | |

### 3.3 Backlog del Producto

| ID | Historia | Épica | Puntos | Prioridad | Sprint |
|----|----------|-------|--------|-----------|--------|
| US-1.1 | [COMPLETAR con el backlog generado por el Agente Scrum Master] | E-1 | 3 | Highest | 1 |

> 📌 **INSTRUCCIÓN:** Copiar aquí el contenido de `scripts/epics_and_stories.json` en formato tabla.

### 3.4 Ceremonias Scrum Realizadas

| Ceremonia | Fecha | Duración | Evidencia |
|-----------|-------|----------|-----------|
| Sprint Planning S1 | [DD/MM] | 2h | [Captura/Enlace] |
| Daily Standup | [DD/MM] | 15min | [Captura/Enlace] |
| Sprint Review S1 | [DD/MM] | 1h | [Captura/Enlace] |
| Sprint Retrospectiva S1 | [DD/MM] | 45min | [Captura/Enlace] |

### 3.5 Capturas del Tablero Jira

> 📌 **INSTRUCCIÓN:** El Agente DevOps debe tomar screenshots del tablero Jira usando el MCP Playwright y guardarlos en `docs/screenshots/`.

**Tablero Kanban/Scrum:**  
[Insertar captura — `docs/screenshots/04-jira-board.png`]

**Backlog priorizado en Jira:**  
[Insertar captura del backlog]

---

## 4. Implementación y Despliegue en Nube

### 4.1 Modelo Entidad-Relación y Schema de Base de Datos

[COMPLETAR: Descripción del schema de Prisma, decisiones de normalización y configuración de Supabase]

**Schema de Prisma:** [Ver `/backend/prisma/schema.prisma`](../backend/prisma/schema.prisma)

**Migraciones aplicadas:**
```bash
npx prisma migrate dev --name [nombre]   # Desarrollo
npx prisma migrate deploy                 # Producción
```

### 4.2 Estrategia de Branching

```
main           ← Producción (protegida, requiere PR aprobado)
  └── develop  ← Staging (integración continua)
        ├── feature/autenticacion-jwt
        ├── feature/gestion-[entidad-1]
        └── feature/gestion-[entidad-2]
```

### 4.3 URLs del Sistema en Producción

| Componente | URL | Estado |
|------------|-----|--------|
| **Backend API** | `https://[nombre-app].onrender.com` | 🟢 Activo |
| **Frontend** | `https://[nombre-app].vercel.app` | 🟢 Activo |
| **Health Check** | `https://[nombre-app].onrender.com/api/health` | 🟢 200 OK |

**Captura del frontend en producción:**  
[Insertar — `docs/screenshots/01-frontend-deployed.png`]

**Captura del health check de la API:**  
[Insertar — `docs/screenshots/02-api-health.png`]

### 4.4 Pipeline CI/CD

**Archivo:** [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)

**Stages del pipeline:**
1. ✅ Checkout del código
2. ✅ Setup Node.js 20
3. ✅ `npm ci` (backend + frontend)
4. ✅ `npm run lint` (backend + frontend)
5. ✅ `npm test` (backend)
6. ✅ `npm run build` (frontend)
7. 🚀 Deploy a Render (push a `main`)
8. 🚀 Deploy a Vercel (push a `main`)

**Captura del pipeline en verde:**  
[Insertar — `docs/screenshots/03-github-actions-green.png`]

### 4.5 Configuración de Variables de Entorno en Producción

Variables configuradas en Render (sin valores reales):

| Variable | Descripción |
|----------|-------------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Cadena de conexión PostgreSQL Supabase |
| `JWT_SECRET` | Secreto de 64 bytes para firma JWT |
| `FRONTEND_URL` | URL del frontend en Vercel |
| `PORT` | Configurado automáticamente por Render |

---

## Anexo A: Guía de Instalación Local

```bash
# 1. Clonar el repositorio
git clone https://github.com/[usuario]/[repo].git
cd [repo]

# 2. Configurar los MCPs del proyecto (ecosistema agéntico)
node scripts/setup_mcps.js

# 3. Backend
cd backend && cp .env.example .env
# Editar .env con credenciales reales
npm install && npx prisma generate && npx prisma migrate dev

# 4. Frontend (en otra terminal)
cd frontend && cp .env.example .env
npm install && npm run dev

# 5. Subir historias a Jira (script Python)
cd scripts && pip install requests python-dotenv
python jira_automator.py --dry-run  # Verificar primero
python jira_automator.py             # Crear en Jira
```

## Anexo B: Ecosistema Agéntico Utilizado

| Agente | Archivo | Activación |
|--------|---------|------------|
| Scrum Master | `.agents/agent_scrum_master.md` | "Analiza el caso y genera el backlog" |
| Arquitecto | `.agents/agent_architect.md` | "Genera los diagramas para el informe" |
| Backend DBA | `.agents/agent_backend_dba.md` | "Diseña la BD y crea los endpoints" |
| DevOps | `.agents/agent_devops.md` | "Gestiona Git y verifica el deploy" |

**MCPs Instalados:** Ver [`.agents/mcp_config.json`](../.agents/mcp_config.json)

---

*Informe generado con el Boilerplate Universal PC2-PFDC3 — Ecosistema Agéntico*
