# Skill — Git Push & GitHub Swarm Notification Protocol

## Propósito
Este documento define la directiva para que los agentes de IA (como OpenCode, Antigravity, DevOps y Backend DBA) comuniquen y sincronicen sus esfuerzos automáticamente cuando se realicen operaciones de publicación de código (`git push`) en el repositorio remoto de GitHub.

---

## 1. El Protocolo de Notificación Swarm (Multi-Agent Sync)

Cuando un agente realiza un `git push` con éxito hacia el repositorio remoto, debe notificar inmediatamente al resto de agentes del ecosistema mediante los siguientes mecanismos:

### 1.1 El Archivo de Sincronización del Ecosistema (`.agents/sync_history.json`)
El agente que realiza el push debe registrar los detalles del push en el archivo de historial de sincronización para que los demás agentes puedan leerlo al iniciar sus respectivas tareas. El formato de registro es:

```json
{
  "last_push": {
    "timestamp": "2026-06-25T15:30:00.000Z",
    "agent": "DevOps SRE",
    "branch": "feature/US02-proximity-and-traffic-lights",
    "commits": [
      "feat(core): implementar motor de proximidad PostGIS y validación SRE de semáforo rojo",
      "test(service): añadir suite de integración 15/15 para asignación vial"
    ],
    "pull_request_url": "https://github.com/EdwinFlores19/PC2-EnRuta/pull/new/feature/US02-proximity-and-traffic-lights",
    "api_contracts_updated": true
  }
}
```

### 1.2 Regla de Lectura para Otros Agentes (Frontend / Scrum / Architect)
Al iniciar cualquier sesión de desarrollo o análisis, cada agente del ecosistema DEBE:
1.  Leer `.agents/sync_history.json` para verificar si hay código recién publicado en ramas remotas.
2.  Si la rama publicada contiene lógicas de backend o contratos de API actualizados, el agente Frontend (Antigravity) puede proceder con seguridad a sincronizar su capa de consumo HTTP (`axios`) y sus componentes de interfaz de usuario correspondientes.

---

## 2. Acciones del Agente Emisor (DevOps / SRE)

Al completar un `git push`, el agente local debe:
1.  **Actualizar el archivo `.agents/sync_history.json`** con la información de la rama remota y los hashes de commit correspondientes.
2.  **Imprimir en la salida principal el Contrato de API en formato Markdown** con absoluta precisión técnica (Endpoints, payloads de entrada, respuestas HTTP exitosas y sus respectivos esquemas JSON), permitiendo que los agentes Frontend lean directamente la especificación técnica en un solo ciclo de atención.
3.  **Mantener la rama local limpia** y dejar el workspace listo para que el usuario o el siguiente agente continúe la integración.
