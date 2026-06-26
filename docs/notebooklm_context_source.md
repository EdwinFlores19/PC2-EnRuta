# BASE DE CONOCIMIENTO MAESTRA PARA NOTEBOOKLM — ARQUITECTURA SRE & DEVSECOPS (PC2)

> **PROPÓSITO:** Sube este archivo Markdown completo como fuente (source) a tu libreta de NotebookLM. Al hacerlo, cualquier chat que inicies en Gemini Web utilizando esta libreta compartirá el 100% de la verdad arquitectónica del proyecto, previniendo errores, fallas de base de datos o inconsistencias de tipos.

---

## 1. Directrices de Arquitectura Fija e Inmutable

Cualquier propuesta o código generado por el LLM debe respetar estrictamente estas decisiones técnicas:

### 1.1 Stack Tecnológico
*   **Backend:** Node.js + Express (Servidor de larga duración, no serverless). CommonJS (`require` / `module.exports`) compilado desde **TypeScript (ES6 imports)** a la carpeta `/dist`.
*   **Base de Datos:** PostgreSQL alojado en Supabase (usado únicamente como infraestructura, no se delega lógica ni RLS a Supabase).
*   **ORM:** Prisma ORM, actuando como única fuente de verdad a través de `/backend/prisma/schema.prisma`.
*   **Frontend:** React + Vite Single Page Application (SPA), usando TypeScript (`.tsx`), Tailwind CSS y Axios para peticiones HTTP.
*   **Enrutador:** `react-router-dom` para enrutamiento del lado del cliente.
*   **Testing:** Jest en el Backend (`npm test`) y Vitest en el Frontend (`npm test`).

### 1.2 Estructura del Monorepositorio
```
PC2-PFDC3/
├── backend/                    # Proyecto Backend (TypeScript)
│   ├── config/
│   │   └── database.ts         # Singleton de conexión con Prisma
│   ├── prisma/
│   │   ├── schema.prisma       # Única fuente de verdad de DB
│   │   └── seed.ts             # Semilla de base de datos
│   └── src/
│       ├── routes/             # Enrutamiento de la API REST
│       ├── controllers/        # Controladores (Request/Response)
│       ├── services/           # Lógica de Negocio pura
│       ├── repositories/       # Queries de Prisma
│       ├── middlewares/        # Middlewares (autenticación y validación)
│       └── utils/              # Utilidades (logger winston, response formats)
├── frontend/                   # Cliente Frontend (React + Vite + TSX)
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.ts        # Cliente Axios con cola de Token Refresh
│   │   ├── components/         # Componentes de UI (Form, List, etc.)
│   │   └── main.tsx            # Punto de entrada
│   └── vercel.json             # Redireccionamiento 404 para Vercel
├── scripts/                    # Scripts de Automatización
│   ├── generate_crud.ts        # Generador de CRUD TS MVC autónomo
│   └── devsecops_commit.ts     # Skill de validación pre-commit y push
└── render.yaml                 # Blueprint declarativo para Render
```

---

## 2. Parches SRE Críticos (Lecciones de la Práctica)

Asegúrate de que la IA conozca estos problemas reales que ya fueron diagnosticados y resueltos:

### 2.1 El Crash del Puerto en Prisma (URL-Encoding de Contraseña)
*   **Error Común:** `PrismaClientInitializationError: invalid port number in database URL.`
*   **Causa Raíz:** Ocurre cuando la contraseña del PostgreSQL en Supabase tiene caracteres especiales como `?` o `@` que el parseador `new URL()` de Node interpreta como delimitadores sintácticos.
*   **Solución Obligatoria:** Codificar la contraseña en formato URL.
    *   *Ejemplo real:* La contraseña de tu examen `PracticaCalificada3?` debe escribirse en la URL de conexión como **`PracticaCalificada3%3F`** (`?` se codifica como `%3F`).
*   **URL de Conexión de Supabase (Connection Pooler):**
    `postgresql://postgres.bkoxlytgdblskafywnxs:PracticaCalificada3%3F@aws-1-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true`

### 2.2 Error 404 de Vercel API (Team Scopes)
*   **Error Común:** Querying `/v9/projects/{projectId}/deployments` devuelve un `404 Not Found`.
*   **Causa Raíz:** La cuenta de Vercel del usuario es un Team (`team_...`), y las peticiones a la API de Vercel requieren pasar de forma obligatoria el parámetro `?teamId=team_mkgVneGADODyvoJH4lqwGxLI` en la URL del endpoint para que la API resuelva el proyecto correctamente.

### 2.3 Zombie Processes en GitHub Actions (Jest Cuelgues)
*   **Error Común:** El pipeline CI/CD en GitHub Actions se queda colgado indefinidamente en el paso de tests.
*   **Causa Raíz:** Jest mantiene hilos asíncronos abiertos (por ejemplo, pools de bases de datos que no se cerraron).
*   **Solución Obligatoria:** Agregar las banderas `--detectOpenHandles` y `--forceExit` al comando de ejecución de Jest en el `package.json` de backend y configurar un límite de tiempo en el pipeline (`timeout-minutes: 10`).

---

## 3. Guía de Mejores Prácticas de Postgres para Agentes de IA (2026)

Según las directrices de `supabase/agent-skills` de abril de 2026, los agentes deben cumplir estrictamente:

1.  **Indexación de Claves Foráneas (FK):** PostgreSQL **no** indexa automáticamente las claves foráneas. Siempre se debe declarar un índice explícito (`@@index([fk_field])`) debajo de cada relación en el `schema.prisma` para prevenir sequential scans masivos.
2.  **Uso de Connection Poolers:** En el backend, las conexiones deben dirigirse a través de Supavisor en el puerto `6543` (Transaction Mode) utilizando el pgbouncer parameter para evitar agotar las conexiones del pool.
3.  **Soft Delete sobre Physical Delete:** En las tablas del modelo de negocio, se prefiere agregar un campo `isDeleted Boolean @default(false)` para realizar borrados lógicos y salvaguardar la integridad histórica.

---

## 4. Prompts de Generación de Código Listos para Copiar (PC2)

Cuando comience tu examen de mañana, puedes copiar literalmente estos prompts optimizados desde NotebookLM y pegarlos en tu pestaña activa de Gemini Web para obtener respuestas perfectas a la primera:

### 📋 Prompt 1: Generación del Backlog y Modelo de Datos
> *"Analiza el enunciado del examen que acabo de proveer. A partir de las especificaciones, realiza lo siguiente respetando las directrices de mi base de conocimiento:
> 1. Identifica las dos entidades principales de negocio con sus relaciones.
> 2. Genera el JSON exacto para `/scripts/epics_and_stories.json` siguiendo la estructura de la libreta, con 3 épicas funcionales, historias con descripción en formato 'COMO/QUIERO/PARA' y criterios de aceptación en Gherkin 'DADO QUE/CUANDO/ENTONCES'. Usa únicamente números Fibonacci para Story Points.
> 3. Genera el código del `schema.prisma` para ambos modelos, aplicando UUIDs v4 como llaves primarias,timestamps, soft delete y los índices `@@index` obligatorios en las claves foráneas (FK) de acuerdo con los Postgres Best Practices de Supabase de 2026."*

### 🎨 Prompt 2: Controlador y Lógica de Negocio TypeScript
> *"Genera la lógica del controlador de Express y el servicio para la entidad [NombreEntidad] en TypeScript. Debe seguir estrictamente la arquitectura desacoplada de mi monorepositorio:
> 1. El controlador debe usar el Request/Response de Express y el helper `asyncHandler` de `../utils/index.js` para propagar excepciones, devolviendo respuestas con el formato de `buildResponse` o `buildPaginatedResponse`.
> 2. El servicio debe encapsular la lógica pura del negocio sin importar objetos de Express.
> 3. Genera las reglas de validación usando `express-validator` para añadir al archivo de rutas."*

### 📊 Prompt 3: Diagramas de Arquitectura en Mermaid.js
> *"Genera el código Mermaid.js exacto para los 4 diagramas obligatorios del informe en `/docs/informe-pc2.md` adaptados para el caso de negocio del examen:
> 1. Diagrama de Casos de Uso (Left-to-Right con actores primarios, secundarios e includes/extends).
> 2. Diagrama de Arquitectura Lógica (TB, mostrando las capas de presentación, aplicación y datos, mapeando los middlewares reales como CORS, helmet y rate limit).
> 3. Diagrama de Arquitectura Física en Nube (TB, mostrando Vercel, Render y Supabase junto con el pipeline de GitHub Actions).
> 4. Modelo Entidad-Relación (ER completo en 3FN indicando llaves primarias, foráneas, cardinalidades y tipos reales de Postgres)."*
