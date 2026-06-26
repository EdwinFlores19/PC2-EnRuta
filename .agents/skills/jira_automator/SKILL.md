---
name: jira-scrum-automator
description: >
  Automatiza la creación masiva de Épicas e Historias de Usuario en Jira Cloud.
  Úsalo cuando el usuario diga "sube las historias a Jira", "crea el backlog en Jira",
  "ejecuta el automatizador de Jira" o "sube las US". Lee el archivo
  scripts/epics_and_stories.json y crea todos los issues en Jira usando la API REST v3.
  Preferir el MCP de Atlassian si está disponible; fallback al script Python.
---

# Skill: Jira Scrum Automator

## Modo 1: Via MCP Atlassian (Preferido)

Si el MCP de Atlassian está activo, usar directamente:

```
INSTRUCCIÓN PARA EL AGENTE:
1. Leer el archivo scripts/epics_and_stories.json con el MCP filesystem
2. Para cada épica en el JSON:
   a. Crear la épica en Jira usando el MCP Atlassian
   b. Para cada story dentro de la épica:
      - Crear la story vinculada a la épica padre
      - Asignar story points
      - Asignar prioridad y labels
3. Verificar que todos los issues fueron creados correctamente
4. Tomar screenshot del tablero Jira con el MCP Playwright como evidencia
```

## Modo 2: Via Script Python (Fallback)

Si el MCP Atlassian no está disponible:

### Prerrequisitos

```bash
pip install requests python-dotenv
```

### Variables de entorno necesarias (en .env raíz)

```
JIRA_DOMAIN=tu-empresa.atlassian.net
JIRA_EMAIL=tu-email@empresa.com
JIRA_API_TOKEN=ATATT_tu_token_aqui
JIRA_PROJECT_KEY=PC2
```

Obtener el API Token: https://id.atlassian.com/manage-profile/security/api-tokens

### Ejecución

```bash
# Simular sin crear nada (DRY RUN - recomendado primero):
python scripts/jira_automator.py --dry-run

# Ejecutar y crear en Jira:
python scripts/jira_automator.py

# Solo una épica específica:
python scripts/jira_automator.py --epic E-1
```

## Formato del JSON esperado

El archivo `scripts/epics_and_stories.json` debe tener esta estructura:

```json
{
  "project": {
    "name": "Nombre del Sistema",
    "version": "MVP v1.0"
  },
  "epics": [
    {
      "id": "E-1",
      "title": "ÉPICA 1: Nombre del Módulo",
      "description": "Descripción de la épica",
      "acceptance_criteria": ["criterio 1", "criterio 2"],
      "story_points": 21,
      "priority": "Highest",
      "labels": ["MVP", "autenticacion"],
      "stories": [
        {
          "title": "US-1.1: Título de la historia",
          "description": "COMO [rol]\nQUIERO [acción]\nPARA [valor]",
          "acceptance_criteria": [
            "DADO QUE [...], CUANDO [...], ENTONCES [...]",
            "DADO QUE [...], CUANDO [...], ENTONCES [...]"
          ],
          "story_points": 3,
          "priority": "High",
          "labels": ["backend", "autenticacion"]
        }
      ]
    }
  ]
}
```

## Verificación Post-Creación

Después de ejecutar el script, verificar:

1. **Via MCP Playwright:** Navegar al tablero de Jira y tomar screenshot
2. **Via MCP Atlassian:** Listar los issues del proyecto y verificar conteo
3. **Manualmente:** Revisar en https://[empresa].atlassian.net/jira/software/projects/[KEY]/boards

## Troubleshooting Común

| Error | Causa | Solución |
|-------|-------|----------|
| `401 Unauthorized` | API Token inválido o expirado | Regenerar token en Atlassian |
| `404 Not Found` | JIRA_PROJECT_KEY incorrecto | Verificar la clave del proyecto en la URL de Jira |
| `400 Bad Request — issuetype` | El tipo de issue no existe en el proyecto | Verificar con `python jira_automator.py --list-types` |
| `429 Too Many Requests` | Rate limit de la API de Jira | El script hace retry automático; esperar y reintentar |
| `P2002 Unique constraint` | Epic Link field incorrecto | Cambiar `customfield_10014` a `parent` en el script |
