---
name: playwright-web-testing
description: >
  Usa el MCP de Playwright (@playwright/mcp) para hacer testing end-to-end del sistema.
  Úsalo para: verificar que el frontend React funciona correctamente después del deploy,
  probar flujos de autenticación, tomar screenshots para el informe, y verificar los
  health checks de la API. Activar cuando el usuario diga "prueba la web", "verifica el
  deploy", "toma un screenshot" o "comprueba que funciona en el navegador".
---

# Skill: Playwright Web Testing

## Prerrequisitos

Antes de usar este skill, verificar que Playwright está instalado:
```bash
npx playwright install chromium
```

## Casos de Uso Principales

### CASO 1: Verificar Health Check de la API

```
INSTRUCCIÓN PARA EL AGENTE:
Usa el MCP de Playwright para navegar a:
  http://localhost:3001/api/health (desarrollo)
  https://[nombre-app].onrender.com/api/health (producción)

Verificar que la respuesta JSON contiene:
  { "status": "ok", "environment": "[entorno]", "timestamp": "..." }

Tomar un screenshot y guardarlo como:
  docs/screenshots/api-health-check.png
```

### CASO 2: Verificar que el Frontend React carga

```
INSTRUCCIÓN PARA EL AGENTE:
Usa el MCP de Playwright para:
1. Navegar a http://localhost:5173 (o URL de producción)
2. Esperar que la página cargue completamente (wait for load)
3. Verificar que no hay errores en la consola del navegador
4. Tomar un screenshot de la página principal
5. Guardar como docs/screenshots/frontend-home.png
```

### CASO 3: Probar flujo de Registro y Login

```
INSTRUCCIÓN PARA EL AGENTE:
Usa el MCP de Playwright para ejecutar el flujo completo:

PASO 1 — Registro:
  Navegar a: /register (o ruta equivalente)
  Llenar campo email: test-[timestamp]@example.com
  Llenar campo password: TestPassword123!
  Hacer click en el botón de registro
  Verificar: aparece mensaje de éxito o redirección al login

PASO 2 — Login:
  Navegar a: /login
  Llenar email y password con las credenciales anteriores
  Hacer click en el botón de login
  Verificar: redirección al dashboard/home autenticado
  Tomar screenshot como evidencia

PASO 3 — Endpoint protegido:
  Verificar que se puede acceder a un endpoint autenticado
  (el token JWT debe estar en localStorage o enviarse automáticamente)
```

### CASO 4: Evidencia para el Informe PC2

```
INSTRUCCIÓN PARA EL AGENTE:
Tomar screenshots de las siguientes pantallas para incluir en docs/informe-pc2.md:

1. docs/screenshots/01-frontend-deployed.png
   → Página principal del sistema en producción

2. docs/screenshots/02-api-health.png
   → Respuesta del endpoint /api/health

3. docs/screenshots/03-github-actions-green.png
   → Pipeline CI/CD en verde en GitHub Actions
   (navegar a: https://github.com/[user]/[repo]/actions)

4. docs/screenshots/04-jira-board.png
   → Tablero de Jira con las épicas/stories creadas
   (navegar a: https://[empresa].atlassian.net/jira/software/projects/[KEY]/boards)

5. docs/screenshots/05-render-dashboard.png
   → Dashboard de Render mostrando el servicio activo

Guardar todos los screenshots en docs/screenshots/
Actualizar el informe-pc2.md con las referencias a las imágenes.
```

### CASO 5: Testing de endpoints REST con Playwright

```
INSTRUCCIÓN PARA EL AGENTE:
Usa el MCP de Playwright para probar los endpoints REST directamente:

TEST 1 — POST /api/v1/auth/register:
  navigate a about:blank
  evaluate:
    fetch('http://localhost:3001/api/v1/auth/register', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({email: 'test@test.com', password: 'Test123!', name: 'Test User'})
    }).then(r => r.json())
  Verificar: respuesta con status 201 y objeto user

TEST 2 — GET /api/v1/auth/login:
  Ejecutar similar con las credenciales creadas
  Verificar: respuesta con accessToken en el body

TEST 3 — GET /api/v1/users/me (autenticado):
  Incluir el accessToken en el header Authorization
  Verificar: respuesta con los datos del usuario sin el campo password
```

## Configuración del MCP en el Proyecto

El MCP de Playwright está declarado en `.agents/mcp_config.json`:
```json
"playwright": {
  "command": "npx",
  "args": ["@playwright/mcp@latest", "--headless"]
}
```

## Notas Importantes

- **Usar SIEMPRE `@playwright/mcp`** (scope oficial de Microsoft). NO usar `playwright-mcp` ni `@executeautomation/playwright-mcp-server`.
- El modo `--headless` es suficiente para testing en CI. Para desarrollo visual, quitar el flag.
- Los screenshots se guardan en el directorio actual; especificar ruta absoluta si es necesario.
- Para testing de autenticación con cookies httpOnly, Playwright maneja automáticamente las cookies.
