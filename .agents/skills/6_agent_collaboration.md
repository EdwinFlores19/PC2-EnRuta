# Skill — Agent Collaboration, Prompting & Conflict Prevention

## Propósito
Este documento instruye a cualquier Agente de IA (como OpenCode o Antigravity) sobre cómo operar en armonía en el monorreferencial sin colisionar, entendiendo el flujo de delegación, respetando las fronteras de directorios de cada rol, y optimizando el análisis de prompts generados desde Gemini Web o NotebookLM.

---

## 1. Prevención de Conflictos de Agentes (Anti-Collision Protocol)

En entornos de desarrollo multi-agente donde varios LLMs operan en un mismo sistema de archivos local, se debe seguir estrictamente este protocolo para evitar corrupción de código y sobre-escritura:

### 1.1 El Principio de Unicidad de Escritura (Single Writer Principle)
*   **La Regla:** Solo **un** cliente principal de IA (ej: OpenCode) debe tener permisos activos de escritura sobre el workspace a la vez. No abras simultáneamente sesiones de terminal con herramientas automáticas competitivas que realicen cambios simultáneos sin supervisión humana.
*   **Excepción:** Puedes delegar tareas paralelas si y solo si los sub-agentes tienen **scopes de directorios completamente separados** (por ejemplo, un sub-agente trabajando exclusivamente en `/backend/src/services` y otro trabajando exclusivamente en `/frontend/src/components`).

### 1.2 Regla de Sincronización de Archivos
Antes de realizar cualquier edición o compilación, el agente debe:
1.  Verificar si existen cambios locales sin guardar (`git status`).
2.  Si hay conflictos locales, notificar de inmediato al humano para realizar un `git stash` o resolución antes de escribir.
3.  Utilizar las herramientas de análisis en frío (`npx tsc --noEmit` y `npm test`) para asegurar que el workspace esté en un estado estable (verde) antes de inyectar nueva lógica.

---

## 2. Protocolo de Procesamiento de Prompts de Gemini Web / NotebookLM

Cuando el desarrollador copie y pegue un prompt estructurado desde la base de conocimientos de NotebookLM o la interfaz web de Gemini, el agente local debe interpretarlo siguiendo estas reglas:

### 2.1 Mapeo de Entidades
*   Al recibir las especificaciones de entidades (ej: `Product` y `User`), el agente DBA local debe mapearlas en el `schema.prisma`.
*   Inmediatamente después de actualizar el esquema, el agente debe ejecutar:
    ```bash
    npx tsx scripts/generate_crud.ts <NombreEntidad> <Ruta_API>
    ```
    *Esto automatizará el 90% del boilerplate del backend en TypeScript con cero margen de error sintáctico.*

### 2.2 Sincronización del Frontend
*   Al recibir el diseño de componentes TSX desde Gemini Web, el agente frontend local no debe intentar generar todo el código de una sola vez.
*   Debe tomar las lógicas generadas en la web, colocarlas dentro de `/frontend/src/components/_form.tsx` y `/frontend/src/components/_list.tsx` (reemplazando los marcadores correspondientes) y enlazarlas en `/frontend/src/App.tsx`.

### 2.3 Compilación y Publicación
Una vez que el código ha sido pegado e integrado localmente, **el agente nunca debe hacer git push de forma manual**. Debe invocar el script automatizado DevSecOps:
```bash
npx tsx scripts/devsecops_commit.ts "feat(modulo): agregar modulo [nombre] de negocio"
```
*Este comando compilará el código de forma exhaustiva en el backend y el frontend. Si hay un error de tipos, detendrá el commit de forma segura, informando de inmediato la línea de error para su corrección.*
