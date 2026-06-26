# AGENTS.md — Directrices del Ecosistema Agéntico PC2-PFDC3

## Propósito

Este directorio `.agents/` define el ecosistema completo de Inteligencia Artificial que asiste
en el desarrollo del proyecto. Cada agente tiene un rol único e irremplazable, y **nunca debe
salir de su dominio de responsabilidad**.

## Reglas Globales (aplican a TODOS los agentes)

1. **Nunca inventar código de negocio** que no haya sido aprobado en el backlog de Jira.
2. **Siempre seguir Git Flow**: `main` → `develop` → `feature/[nombre]`.
3. **Commits en Conventional Commits**: `feat:`, `fix:`, `chore:`, `docs:`, `test:`.
4. **Las variables de entorno NUNCA se hardcodean** en el código. Siempre se leen de `.env`.
5. **El backend Express NUNCA usa arquitectura Serverless** ni delega lógica de negocio a Supabase.
6. **Supabase es SOLO la infraestructura de base de datos** (PostgreSQL gestionado).
7. **Todos los MCPs disponibles deben usarse** para maximizar la automatización.
8. **El archivo `docs/informe-pc2.md` es el único destino** para la documentación del examen.

## Agentes Disponibles

| Agente | Archivo | Especialidad |
|--------|---------|-------------|
| Scrum Master | `agent_scrum_master.md` | Backlog, US, Story Points |
| Arquitecto | `agent_architect.md` | Diagramas Mermaid (Casos de Uso, Arquitectura) |
| Backend DBA | `agent_backend_dba.md` | Express, PostgreSQL, Prisma, CORS |
| DevOps | `agent_devops.md` | Git, CI/CD, GitHub Actions, Render |

## Stack Tecnológico Fijo (NO negociable)

- **Backend:** Node.js + Express (servidor de larga duración)
- **ORM:** Prisma sobre PostgreSQL
- **BD:** PostgreSQL en Supabase (solo como proveedor de DB)
- **Frontend:** React + Vite
- **CI/CD:** GitHub Actions → Render (backend) + Vercel (frontend)

## MCPs Instalados en este Proyecto

Ver: `.agents/mcp_config.json`

Los MCPs activos para este proyecto son:
- `filesystem` — Lectura/escritura de archivos del proyecto
- `github` — Gestión de repositorio, PRs, Actions
- `playwright` — Testing de UI en el navegador
- `supabase` — Gestión de la base de datos PostgreSQL
- `atlassian` — Automatización de Jira (épicas, stories, sprints)
