# Skill — Jira Scrum Master Automator

## Propósito
Guiar a futuros agentes de IA sobre cómo automatizar y subir historias de usuario y épicas masivamente desde `/scripts/epics_and_stories.json` hacia Jira Cloud.

## Procedimiento Operativo

1. **Localización de Credenciales:**
   - La IA debe leer obligatoriamente `/.env.agents` para cargar:
     - `JIRA_DOMAIN` (ej: `edwinfloress.atlassian.net`)
     - `JIRA_EMAIL` (ej: `ejuniorfloress@gmail.com`)
     - `JIRA_API_TOKEN` (ej: `ATATT...`)
     - `JIRA_PROJECT_KEY` (por ejemplo, `PFDC3` o `SCRUM`)

2. **Autenticación (Basic Auth):**
   - El token de Atlassian requiere autenticación básica codificada en Base64:
     ```typescript
     const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
     ```

3. **Carga en Lote:**
   - Realizar peticiones `POST` a `https://${JIRA_DOMAIN}/rest/api/3/issue` mapeando las épicas e historias de usuario en `/scripts/epics_and_stories.json`.
   - Utilizar el campo `story_points` para mapear los puntos Fibonacci y vincular las historias de usuario a sus correspondientes épicas asignándoles el campo `parent`.
