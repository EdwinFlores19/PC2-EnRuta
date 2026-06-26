# Skill — Cloud Health Check & SRE Audit

## Propósito
Permitir a cualquier Agente Autónomo (LLM) realizar un diagnóstico en caliente, idempotente y de solo lectura de la infraestructura cloud del proyecto.

## Flujo de Ejecución (Node.js)

Para verificar el estado de Vercel y Render sin alterar recursos:

```typescript
import https from 'https';
import fs from 'fs';

// 1. Leer /.env.agents para cargar tokens
const envContent = fs.readFileSync('/.env.agents', 'utf-8');
// Parsear VERCEL_TOKEN, VERCEL_PROJECT_ID, VERCEL_ORG_ID, RENDER_API_KEY, RENDER_SERVICE_ID...

// 2. Query Vercel Project Info
const vercelOptions = {
  hostname: 'api.vercel.com',
  path: `/v9/projects/${VERCEL_PROJECT_ID}?teamId=${VERCEL_ORG_ID}`,
  method: 'GET',
  headers: { 'Authorization': `Bearer ${VERCEL_TOKEN}` }
};

// 3. Query Render Service Info
const renderOptions = {
  hostname: 'api.render.com',
  path: `/v1/services/${RENDER_SERVICE_ID}`,
  method: 'GET',
  headers: { 'Authorization': `Bearer ${RENDER_API_KEY}`, 'Accept': 'application/json' }
};
```

## Respuestas Esperadas
- **Vercel:** HTTP 200 con el JSON conteniendo el nombre del proyecto y alias activos.
- **Render:** HTTP 200 con el JSON conteniendo el estado del servicio web (si está suspendido o live).
- **GitHub:** GET a `/repos/{owner}/{repo}/commits/main/check-runs` para auditar el estado del pipeline de integración continua.
