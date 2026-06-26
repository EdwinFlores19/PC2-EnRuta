---
name: render-deploy-manager
description: >
  Gestiona los despliegues del backend Node.js/Express en Render usando el MCP de Render.
  Úsalo cuando el usuario diga "despliega en Render", "verifica el deploy", "ver los logs
  de Render", "configura las variables de entorno en Render" o "diagnostica el servicio".
  También útil para crear servicios nuevos en Render desde cero.
---

# Skill: Render Deploy Manager

## Configuración del MCP de Render

El MCP de Render está declarado en `.agents/mcp_config.json`:
```json
"render": {
  "serverUrl": "https://mcp.render.com/mcp",
  "headers": {
    "Authorization": "Bearer YOUR_RENDER_API_KEY"
  }
}
```

Obtener API Key: https://dashboard.render.com/account/api-keys
Reemplazar `YOUR_RENDER_API_KEY` en el mcp_config.json del proyecto.

## Caso de Uso 1: Verificar Estado del Deploy

```
INSTRUCCIÓN PARA EL AGENTE:
Usar el MCP de Render para:
1. Listar todos los servicios del proyecto
2. Verificar el estado del Web Service del backend (debe ser "live")
3. Ver los últimos 50 líneas del log de deploy
4. Si hay errores, identificar la causa en los logs
5. Reportar la URL del servicio activo
```

## Caso de Uso 2: Configurar Variables de Entorno en Render

```
INSTRUCCIÓN PARA EL AGENTE:
Usando el MCP de Render, configurar las siguientes variables de entorno en el Web Service:

Variables OBLIGATORIAS:
  NODE_ENV = production
  DATABASE_URL = [cadena de conexión de Supabase]
  JWT_SECRET = [secreto de 64 bytes]
  JWT_REFRESH_SECRET = [otro secreto de 64 bytes]
  FRONTEND_URL = [URL del frontend en Vercel]
  PORT = 3001 (Render lo configura automáticamente, pero incluirlo)

Variables OPCIONALES:
  LOG_LEVEL = info
  BCRYPT_ROUNDS = 12

IMPORTANTE: NUNCA poner los valores reales en archivos del repositorio.
Solo configurar en el Dashboard de Render o via el MCP.
```

## Caso de Uso 3: Trigger Deploy Manual

```
INSTRUCCIÓN PARA EL AGENTE:
Para hacer un deploy manual del backend:
1. Usar el MCP de Render para trigger un nuevo deploy del servicio
2. Monitorear los logs en tiempo real
3. Verificar que el deploy completó exitosamente (status: "live")
4. Usar el MCP de Playwright para verificar el health check:
   https://[nombre-servicio].onrender.com/api/health
```

## Caso de Uso 4: Crear Nuevo Web Service desde Cero

```
INSTRUCCIÓN PARA EL AGENTE:
Si el servicio no existe todavía en Render, crearlo con:

Configuración del Web Service:
  Nombre: pc2-pfdc3-backend
  Runtime: Node
  Branch: main (o develop para staging)
  Build Command: cd backend && npm install && npx prisma generate && npx prisma migrate deploy
  Start Command: cd backend && node server.js
  Plan: Free (para desarrollo/examen)
  Region: Oregon (us-west-2) — más cercano para latencia

Variables de entorno: (configurar las del Caso de Uso 2)
```

## Caso de Uso 5: Diagnóstico de Problemas Comunes

| Síntoma | Diagnóstico | Solución |
|---------|-------------|----------|
| Deploy falla en "Build" | Error en npm install | Ver logs de build, verificar package.json |
| Deploy falla en "Start" | Error al arrancar Express | Verificar DATABASE_URL, JWT_SECRET en env vars |
| 500 Internal Server Error | Error en tiempo de ejecución | Ver logs de runtime en Render |
| CORS error en frontend | FRONTEND_URL incorrecta | Actualizar variable en Render Dashboard |
| Timeout en queries | Conexión BD lenta | Verificar DATABASE_URL apunta a pooler de Supabase |

## Render + GitHub Actions Integration

Para activar el deploy automático desde el pipeline CI/CD:

```yaml
# En .github/workflows/deploy.yml — DESCOMENTAR cuando esté listo:
- name: 🚀 Deploy a Render (Producción)
  if: github.ref == 'refs/heads/main'
  run: |
    curl -X POST "${{ secrets.RENDER_DEPLOY_HOOK_PRODUCTION }}" \
      --fail \
      -H "Content-Type: application/json"
```

Obtener el Deploy Hook URL:
1. Dashboard de Render → Web Service → Settings → Deploy Hook
2. Copiar la URL
3. Guardar en GitHub: Settings → Secrets → `RENDER_DEPLOY_HOOK_PRODUCTION`
