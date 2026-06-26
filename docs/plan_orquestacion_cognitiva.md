# Plan de Orquestación Cognitiva y Estrategia de Trabajo — PC2

**Rol:** Tech Lead & Arquitecto Jefe de IA  
**Stack de Control:** VS Code + OpenCode CLI/Agent Panel  
**Socio Consultor:** Gemini Web UI + NotebookLM (Contexto)  

---

## 1. Introducción al Modelo de Orquestación Cognitiva

En evaluaciones técnicas de alta presión con tiempos restringidos (como la PC2 de mañana), **escribir prompts de forma manual e interactuar paso a paso consume valiosos minutos**. 

Para resolver esto, utilizaremos una **Estructura Desacoplada de Orquestación Cognitiva**:
1.  **NotebookLM (La Base de Conocimiento Central):** Alimentado con el examen resuelto del otro bloque, el informe de la plantilla, las restricciones de arquitectura y la guía SRE de Supabase. Actúa como la fuente de verdad inmutable de especificaciones.
2.  **Gemini Web UI (La CPU Analítica):** Organizado en una estructura multi-pestaña enfocada. Genera código refinado y analiza el caso de negocio basándose en NotebookLM.
3.  **OpenCode (El Ejecutor Local - IDE):** Recibe las lógicas resultantes y ejecuta comandos terminales (compilación, pruebas, migraciones y deploys) mediante agentes y sub-agentes locales.

---

## 2. El Enfoque de 3 Pestañas en Gemini Web UI (Paralelismo Cognitivo)

Mañana, al iniciar el examen, abre **tres pestañas de Gemini Web en paralelo**, todas conectadas a la misma libreta de **NotebookLM** que contiene el contexto completo. Cada pestaña estará "sintonizada" con una parte estricta de la evaluación:

### 🖥️ Pestaña 1: El Diseñador de Datos y Scrum Master (DBA & Product Backlog)
*   **Misión:** Analizar el enunciado del examen, extraer las entidades del negocio, modelar el schema en 3FN y redactar el backlog Scrum en formato Gherkin.
*   **Prompt inicial a enviar mañana:**
    > *"Gemini, lee la especificación del examen que está en mis fuentes de NotebookLM. A partir del nuevo enunciado del examen: 1) Identifica las 2 entidades principales de negocio. 2) Diseña los Story Points del backlog Scrum y genera el JSON exacto para `/scripts/epics_and_stories.json` siguiendo el formato estricto del archivo. 3) Escribe el bloque de Prisma schema para estas entidades aplicando índices `@@index` en todas las claves foráneas (FK) para evitar Sequential Scans de acuerdo al Postgres Best Practices de Supabase."*

### 🎨 Pestaña 2: El Diseñador de Lógica y Componentes (Backend & Frontend React)
*   **Misión:** Generar las validaciones específicas en los controladores de Express y redactar las interfaces TSX de React para los formularios y listados correspondientes a las entidades de negocio.
*   **Prompt inicial a enviar mañana:**
    > *"Gemini, basándonos en las entidades que hemos diseñado en la pestaña 1, escribe: 1) Las reglas de validación de `express-validator` para añadir al router de Express. 2) El componente React TSX de formulario y listado correspondiente, utilizando Tailwind CSS y nuestro apiClient centralizado `/frontend/src/api/axios.ts`."*

### ⚙️ Pestaña 3: El Ingeniero DevOps & SRE (Diagramas, Deploys e Informe)
*   **Misión:** Generar los diagramas en Mermaid.js requeridos por el informe, monitorear los despliegues de Render/Vercel y redactar las explicaciones técnicas de arquitectura.
*   **Prompt inicial a enviar mañana:**
    > *"Gemini, basándonos en el caso de negocio, genera el código Mermaid.js exacto para los 4 diagramas requeridos en `/docs/informe-pc2.md` (Casos de Uso, Arquitectura Lógica, Arquitectura Física y ER en 3FN) siguiendo el formato del archivo de habilidades `4_diagram_generator.md` de mis fuentes. Asegúrate de evitar caracteres especiales no escapados que rompan el parseo de Mermaid."*

---

## 3. Flujo de Trabajo en Caliente: Del Gemini Web al IDE Local

Para evitar colisiones de agentes y mantener una velocidad de desarrollo vertiginosa, el flujo de trabajo debe seguir este proceso secuencial:

```
[Gemini Web / NotebookLM]
    │  (Genera el bloque de código)
    ▼
[Humano copia y pega]
    │
    ▼
[Crea/Edita los archivos locales]
    │
    ▼
[Ejecuta npx tsx scripts/generate_crud.ts <EntityName>]
    │  (Genera la estructura de rutas, controladores, servicios y repositorios)
    ▼
[Agente DevOps local corre npx tsc --noEmit / npm test]
    │  (Verifica compilación en verde)
    ▼
[Publicación mediante scripts/devsecops_commit.ts "feat(modulo): ..."]
    │  (Push seguro que dispara despliegue automático)
    ▼
[Listo en Producción]
```

---

## 4. Mitigación de Conflictos de Agentes y Fallos

*   **Evita que múltiples herramientas escriban a la vez:** Trabaja con un solo hilo principal de chat de agente local en VS Code. No uses Antigravity y OpenCode compitiendo en el mismo archivo.
*   **Filtro pre-commit:** El script de commit `devsecops_commit.ts` actuará como tu salvaguarda. Si cometes un error copiando y pegando tipos de TypeScript, el script detendrá el commit antes de subirlo y te dirá exactamente en qué línea falló la compilación, asegurando que tu rama pública se mantenga 100% estable.
