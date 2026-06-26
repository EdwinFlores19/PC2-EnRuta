# Sustento Técnico de Arquitectura — Node.js / Express / PostgreSQL / React

> **Documento:** Justificación de Decisiones Arquitectónicas  
> **Clasificación:** Documento Técnico de Ingeniería  
> **Versión:** 1.0 (Genérico — Adaptar con el Skill `skill_modificar_sustento.txt`)

---

## Resumen Ejecutivo

Este documento presenta la justificación técnica y de ingeniería detrás de las decisiones arquitectónicas tomadas para el desarrollo del sistema. La arquitectura seleccionada — un servidor de larga duración Node.js/Express para el backend, PostgreSQL como base de datos relacional, y React como cliente SPA — no es una elección arbitraria, sino el resultado de un análisis estructurado de requisitos no funcionales (escalabilidad, consistencia de datos, mantenibilidad) frente a las alternativas disponibles en el ecosistema actual de desarrollo web.

La premisa fundamental que guía cada decisión técnica es la **separación de responsabilidades** (Separation of Concerns): cada capa del sistema tiene una responsabilidad única y bien delimitada, lo que permite que cada componente escale, evolucione y sea reemplazado de forma independiente sin afectar al resto del sistema.

---

## 1. Arquitectura General: Por qué una API REST con Servidor de Larga Duración

### 1.1 La Decisión Crítica: Servidor Propio vs. Serverless/BaaS

El ecosistema actual ofrece una tentadora alternativa a los servidores tradicionales: las plataformas Backend-as-a-Service (BaaS) como Supabase Functions, Firebase, o los entornos Serverless como Vercel Functions y AWS Lambda. Estas plataformas prometen reducir el tiempo de desarrollo al gestionar la infraestructura automáticamente. Sin embargo, esta conveniencia conlleva compromisos arquitectónicos que resultan inaceptables en sistemas con lógica de negocio compleja, necesidad de escalabilidad controlada, o requisitos de seguridad estrictos.

**Limitaciones de los enfoques Serverless/BaaS para este proyecto:**

| Dimensión | Serverless/BaaS | Servidor Express (Elegido) |
|-----------|----------------|---------------------------|
| **Control de lógica** | La lógica de validación reside en reglas de la plataforma (Row Level Security en Supabase) | 100% de la lógica vive en código propio, versionado y testeable |
| **Cold start latency** | 200ms - 2s de latencia en peticiones tras períodos de inactividad | Respuesta constante < 50ms al estar siempre activo |
| **Estado de conexión BBDD** | Cada invocación abre/cierra conexiones (sin pool persistente) | Pool de conexiones Prisma persistente y optimizado |
| **Debugging** | Difícil de reproducir localmente; depende de logs de la plataforma | Entorno de desarrollo idéntico al de producción (`NODE_ENV`) |
| **Vendor lock-in** | Migrar de Supabase Functions a otro proveedor requiere reescritura | El servidor Express es portable a cualquier contenedor o PaaS |
| **Límites de ejecución** | Timeout máximo de 10-30 segundos por función | Sin límites de ejecución; soporte para operaciones de larga duración |
| **Escalabilidad de lógica** | Las reglas de negocio complejas son difíciles de expresar en SQL/RLS | Capas de servicio en JavaScript con toda la expresividad del lenguaje |

**Conclusión:** Se utiliza Supabase exclusivamente como proveedor de infraestructura PostgreSQL gestionada (eliminando la necesidad de administrar un servidor de base de datos), mientras que toda la lógica de negocio, autenticación, autorización y validación reside en el servidor Express propio. Esta separación garantiza control total, portabilidad y auditabilidad del código.

### 1.2 Modelo de Servidor de Larga Duración (Long-Running Server)

A diferencia de las funciones serverless que se instancian y destruyen por petición, el servidor Express opera como un proceso de Node.js que se inicia una sola vez y permanece activo indefinidamente. Este modelo tiene implicaciones técnicas cruciales:

**Pool de conexiones persistente:** Prisma mantiene un pool de conexiones a PostgreSQL que se inicializa al arrancar el servidor y permanece disponible para todas las peticiones subsiguientes. El coste de establecer una conexión TCP con la base de datos (handshake SSL, autenticación, negociación de parámetros) se paga una sola vez, no en cada request.

**Caché en memoria:** El servidor puede mantener estructuras de datos en memoria (tokens de sesión invalidados, configuración cargada, resultados de queries frecuentes) que persisten entre peticiones, algo imposible en entornos stateless.

**WebSockets y comunicación en tiempo real:** Un servidor de larga duración puede mantener conexiones WebSocket persistentes para funcionalidades en tiempo real, cosa que los entornos serverless no pueden hacer por naturaleza.

---

## 2. Node.js con Express: Justificación Técnica en Profundidad

### 2.1 La Arquitectura de Event Loop de Node.js

Node.js no es simplemente "JavaScript en el servidor". Su diferenciación técnica fundamental radica en su modelo de concurrencia: el **Event Loop** con I/O no bloqueante, construido sobre la biblioteca `libuv`.

**Modelo tradicional multi-hilo (Apache, PHP-FPM, Spring MVC):**
```
Petición 1 → Hilo 1 (bloqueado esperando BBDD) → [ESPERANDO...]
Petición 2 → Hilo 2 (bloqueado esperando BBDD) → [ESPERANDO...]
Petición 3 → Hilo 3 (bloqueado esperando BBDD) → [ESPERANDO...]
Petición 4 → [EN COLA — sin hilos disponibles]
```
Cada petición ocupa un hilo del sistema operativo. Cuando el hilo espera una operación de I/O (query a BBDD, lectura de archivo), ese hilo queda bloqueado y no puede procesar otras peticiones. Con 100 peticiones simultáneas, el sistema necesita 100 hilos, cada uno consumiendo ~1-2MB de memoria de stack.

**Modelo Node.js con Event Loop:**
```
Petición 1 → Event Loop → delega I/O a libuv → [continúa]
Petición 2 → Event Loop → delega I/O a libuv → [continúa]
Petición 3 → Event Loop → delega I/O a libuv → [continúa]
Petición 4 → Event Loop → delega I/O a libuv → [continúa]
[Resultado BBDD listo] → Callback en Event Loop → responde petición 1
```

El Event Loop opera en un único hilo, pero las operaciones de I/O se delegan a un pool de hilos del sistema operativo (libuv). Cuando la operación completa, el resultado se encola como un callback que el Event Loop procesa en el próximo ciclo. **El hilo principal nunca se bloquea.**

**Implicación práctica:** Node.js puede manejar miles de conexiones simultáneas con un consumo de memoria constante y predecible, siempre que las operaciones sean mayoritariamente I/O-bound (como lo son la mayoría de APIs web: consultar BBDD, llamar APIs externas, leer archivos). Esta característica es especialmente valiosa en sistemas con alta concurrencia de usuarios.

**Advertencia técnica:** Node.js no es adecuado para operaciones CPU-bound intensivas (procesamiento de imágenes, cálculos criptográficos pesados, machine learning) porque estas bloquearían el Event Loop. Para estos casos, se usan Worker Threads o microservicios dedicados. En el contexto de una API REST CRUD, prácticamente todas las operaciones son I/O-bound, haciendo a Node.js el candidato ideal.

### 2.2 Express.js: Minimalismo Controlado

Express.js es el framework web más utilizado para Node.js (más de 30 millones de descargas semanales en npm). Su filosofía de diseño es la de un **router y sistema de middlewares minimalista**, sin imponer una estructura de carpetas, un ORM, o un sistema de autenticación específico.

**Alternativas evaluadas:**

| Framework | Ventaja | Razón de no elección |
|-----------|---------|---------------------|
| **Fastify** | 20-30% más rápido que Express en benchmarks | Menor ecosistema de middlewares; curva de aprendizaje adicional |
| **NestJS** | Arquitectura opinionada (Angular-style), decorators, DI | Complejidad innecesaria para el scope del proyecto; aumenta el boilerplate |
| **Hono** | Ultra ligero, edge-native | Ecosistema nuevo, menor comunidad, riesgo técnico mayor |
| **Express** ✅ | Maduro, ecosistema completo, equipo familiarizado | **ELEGIDO** |

La elección de Express sobre NestJS merece una mención especial: NestJS es una excelente opción para equipos grandes con necesidad de estructura estricta. Sin embargo, introduce capas de abstracción (módulos, decoradores, inyección de dependencias) que, para un proyecto académico o MVP, generan complejidad accidental que ralentiza el desarrollo sin aportar valor proporcional. Express permite implementar la misma arquitectura (Router → Controller → Service → Repository) de forma explícita y controlada.

### 2.3 El Stack de Seguridad Express

La madurez de Express se refleja en la riqueza de su ecosistema de middlewares de seguridad, todos battle-tested en producción:

- **`helmet`:** Configura automáticamente 15+ headers HTTP de seguridad (Content-Security-Policy, X-XSS-Protection, X-Frame-Options, HSTS, etc.) que protegen contra los ataques más comunes del OWASP Top 10.
- **`cors`:** Control granular del origen de las peticiones. La configuración implementada permite solo los orígenes explícitamente autorizados, rechazando cualquier petición desde dominios no listados.
- **`express-rate-limit`:** Limitación de peticiones por IP para prevenir ataques de fuerza bruta en endpoints de autenticación y denegación de servicio (DoS).
- **`express-validator`:** Validación y saneamiento de inputs del usuario antes de que lleguen a la capa de servicio, previniendo datos malformados e inyecciones.
- **`bcryptjs`:** Hashing de contraseñas con sal aleatoria por defecto. El factor de costo configurable (rounds) permite ajustar la resistencia a ataques de fuerza bruta según el hardware disponible.
- **`jsonwebtoken`:** Implementación estándar de JWT (RFC 7519) para autenticación stateless. Los tokens son firmados con HMAC-SHA256 usando un secreto de 64 bytes, haciendo computacionalmente inviable su falsificación.

---

## 3. PostgreSQL: La Elección de Base de Datos Relacional

### 3.1 Por qué Relacional: El Valor del Modelo ACID

La selección del tipo de base de datos es una de las decisiones arquitectónicas más determinantes del proyecto. El debate NoSQL vs. SQL no es ideológico; es un análisis de los requisitos de consistencia de datos del sistema.

**Las propiedades ACID de PostgreSQL en el contexto del sistema:**

**Atomicidad (Atomicity):** Una transacción que involucra múltiples tablas (ej: crear un pedido Y descontar el inventario Y registrar el pago) se ejecuta como una unidad indivisible. O todas las operaciones tienen éxito, o ninguna. Esto elimina estados inconsistentes en la base de datos (ej: el pedido creado pero el inventario no actualizado).

**Consistencia (Consistency):** Las restricciones de integridad (UNIQUE, NOT NULL, CHECK, FOREIGN KEY) se verifican al final de cada transacción. Si alguna restricción es violada, la transacción completa se revierte. Esto garantiza que la base de datos siempre esté en un estado válido según las reglas de negocio definidas.

**Aislamiento (Isolation):** Cuando múltiples transacciones ocurren simultáneamente (ej: dos usuarios actualizando el mismo registro), PostgreSQL gestiona el aislamiento para que cada transacción vea un estado consistente de la base de datos, previniendo anomalías como lecturas sucias (dirty reads) o lecturas no repetibles (non-repeatable reads). PostgreSQL implementa MVCC (Multi-Version Concurrency Control) para un aislamiento eficiente sin bloqueos excesivos.

**Durabilidad (Durability):** Una vez que PostgreSQL confirma (COMMIT) una transacción, los datos están escritos en disco y sobrevivirán a fallos del sistema (cortes de energía, crashes del proceso, reinicios del servidor). El Write-Ahead Log (WAL) garantiza esta propiedad.

**Comparativa con MongoDB (NoSQL):**

| Criterio | MongoDB | PostgreSQL (Elegido) |
|----------|---------|---------------------|
| Modelo de datos | Documentos JSON flexibles | Tablas relacionales con schema estricto |
| Transacciones | Soporte añadido en v4.0 (limitado) | Soporte completo ACID desde sus inicios |
| Consistencia | Eventual (configurable) | Fuerte por defecto |
| Integridad referencial | No nativa | FOREIGN KEY con CASCADE |
| Consultas complejas | Aggregation Pipeline (verbose) | SQL estándar (JOINs, CTEs, Window Functions) |
| Esquema | Flexible (schema-less) | Estricto (migraciones versionadas) |
| Caso ideal | Datos heterogéneos, jerarquías profundas | Datos relacionales, transacciones críticas |

**Conclusión:** Para un sistema con entidades bien definidas y relaciones entre ellas (Usuarios, Pedidos, Productos, Categorías, etc.), el modelo relacional de PostgreSQL ofrece integridad de datos garantizada a nivel de infraestructura, no solo de aplicación.

### 3.2 Normalización: Diseño sin Redundancias

El schema de la base de datos sigue los principios de normalización hasta la Tercera Forma Normal (3FN):

**1FN (Primera Forma Normal):** Cada columna contiene valores atómicos (indivisibles). No hay grupos repetitivos ni arrays en columnas individuales. Las listas de valores relacionados se modelan como tablas separadas con relaciones 1:N o N:M.

**2FN (Segunda Forma Normal):** Todos los atributos no clave dependen de la clave primaria completa. No existen dependencias parciales (relevant only con claves compuestas).

**3FN (Tercera Forma Normal):** No existen dependencias transitivas entre atributos no clave. Cada atributo depende directamente de la clave primaria, no de otro atributo no clave.

**Beneficios prácticos de la normalización:**
- **Eliminación de anomalías de actualización:** Si el nombre de una categoría cambia, se actualiza en UN solo lugar (la tabla `categories`), no en miles de filas de productos.
- **Reducción del espacio de almacenamiento:** Sin duplicación de datos, la base de datos crece de forma proporcional al volumen real de información, no al de redundancias.
- **Consistencia garantizada:** No puede existir un producto con una categoría que no existe en la tabla de categorías (FOREIGN KEY constraint).

### 3.3 Prisma ORM: Seguridad y Productividad sobre el Driver Raw

Prisma actúa como la capa de abstracción entre el código JavaScript y las consultas SQL de PostgreSQL. La elección de Prisma sobre `pg` (driver directo) o Sequelize (ORM alternativo) se fundamenta en:

**Prevención de SQL Injection por diseño:** Todas las consultas de Prisma son parametrizadas por defecto. Es literalmente imposible construir una query Prisma que sea vulnerable a SQL Injection usando la API estándar del cliente.

**Schema como fuente de verdad:** El archivo `prisma/schema.prisma` es el contrato entre el código y la base de datos. Las migraciones se generan automáticamente a partir de los cambios en el schema, manteniendo un historial auditable y reproducible.

**Generación de tipos:** El cliente de Prisma generado ofrece autocompletado completo en el IDE, reduciendo errores de tipado en nombres de campos o relaciones incorrectas.

---

## 4. React con Vite: El Frontend como Capa Independiente

### 4.1 Separation of Concerns: Frontend y Backend Independientes

La arquitectura separa el frontend (React SPA) del backend (Express API) en dos aplicaciones completamente independientes. Este patrón, conocido como **Decoupled Architecture** o **Headless Architecture**, ofrece ventajas estratégicas significativas:

**Escalabilidad independiente:** El frontend es un conjunto de archivos estáticos (HTML, CSS, JS) distribuidos desde una CDN global. Puede servir millones de usuarios simultáneos sin ninguna carga adicional en el servidor backend. El backend, por su parte, puede escalar horizontalmente (múltiples instancias) de forma independiente al frontend.

**Despliegue independiente:** Un cambio en la UI del frontend puede desplegarse sin reiniciar ni afectar al servidor backend, y viceversa. Esto reduce el riesgo de cada deploy y permite ciclos de entrega más frecuentes.

**API como producto reutilizable:** La API REST del backend no está acoplada al frontend React. El mismo backend puede servir a una aplicación móvil nativa (React Native, Flutter), un cliente de escritorio, o integraciones con terceros, sin ningún cambio en el servidor.

**Desarrollo en paralelo:** El equipo puede dividirse: un desarrollador trabaja en el backend mientras otro trabaja en el frontend, coordinándose únicamente a través del contrato de la API (endpoints, schemas de request/response).

### 4.2 React: Composición de Interfaces Complejas

React introduce el paradigma de **programación declarativa** para interfaces de usuario: en lugar de describir *cómo* actualizar el DOM (imperativo, como en jQuery), describes *qué* debe mostrar la interfaz dado un estado, y React calcula y aplica las actualizaciones mínimas necesarias.

**Virtual DOM:** React mantiene una representación en memoria del DOM (Virtual DOM). Cuando el estado cambia, React recalcula el árbol virtual y aplica solo las diferencias (diffing) al DOM real, minimizando las operaciones costosas de manipulación del DOM.

**Arquitectura basada en componentes:** La UI se construye como composición de componentes reutilizables, cada uno con su propia lógica y estado. Esto permite un desarrollo escalable donde los componentes pueden ser probados, desarrollados y reutilizados de forma independiente.

**Hooks:** Los React Hooks (useState, useEffect, useContext, useCallback, useMemo) permiten gestionar el estado y los efectos secundarios de forma declarativa y reutilizable, sin necesidad de clases o HOCs complejos.

### 4.3 Vite: Herramienta de Build de Nueva Generación

Vite representa un salto generacional frente a Webpack (usado por Create React App):

**Servidor de desarrollo instantáneo:** Vite no empaqueta (bundle) el código durante el desarrollo. Usa ES Modules nativos del navegador para servir los archivos directamente, haciendo que el arranque sea prácticamente instantáneo independientemente del tamaño del proyecto.

**Hot Module Replacement (HMR) preciso:** Cuando un archivo cambia, Vite actualiza solo ese módulo en el navegador sin recargar la página completa, preservando el estado de la aplicación durante el desarrollo.

**Build de producción optimizado:** Para producción, Vite usa Rollup (optimizado para bundling de librerías) que genera código mínimo y con tree-shaking eficiente.

### 4.4 Axios con Interceptores: Capa de Comunicación Robusta

La instancia de Axios configurada en `src/api/axios.js` implementa el patrón de **API Client centralizado**, que ofrece:

- **Punto único de configuración:** La baseURL, los headers comunes y las credenciales se configuran una vez para toda la aplicación.
- **Interceptor de request:** Adjunta automáticamente el token JWT a cada petición sin que los componentes individuales deban conocer la mecánica de autenticación.
- **Interceptor de response con Token Refresh:** Detecta automáticamente los errores 401 (token expirado), renueva el token de forma transparente y reintenta la petición original, ofreciendo al usuario una experiencia de sesión continua sin interrupciones.
- **Manejo centralizado de errores:** Los errores HTTP se procesan en un único lugar, permitiendo mostrar notificaciones de error consistentes en toda la aplicación.

---

## 5. Comparativa Global de Alternativas Arquitectónicas Evaluadas

| Criterio | MERN + Express (Elegido) | Next.js Full-Stack | Django + PostgreSQL | Firebase + React |
|----------|--------------------------|--------------------|--------------------|-----------------|
| **Control de lógica** | ✅ Total | ⚠️ Parcial (edge fns) | ✅ Total | ❌ Limitado (RLS) |
| **Escalabilidad** | ✅ Horizontal | ✅ Serverless auto | ✅ Horizontal | ⚠️ Vendor limits |
| **Tiempo de respuesta** | ✅ Bajo (sin cold start) | ⚠️ Cold start posible | ✅ Bajo | ⚠️ Cold start |
| **Portabilidad** | ✅ Cualquier PaaS/VPS | ⚠️ Optimizado para Vercel | ✅ Cualquier servidor | ❌ Google Cloud lock-in |
| **Madurez del stack** | ✅ Muy maduro | ✅ Maduro | ✅ Muy maduro | ✅ Maduro |
| **Curva de aprendizaje** | ✅ Equipo familiarizado | ⚠️ RSC, SSR, hidratación | ⚠️ Python, Django ORM | ⚠️ Reglas de seguridad |
| **Testing** | ✅ Jest + Supertest | ✅ Vitest | ✅ pytest | ⚠️ Emuladores locales |
| **Observabilidad** | ✅ Winston + logs | ⚠️ Logs de plataforma | ✅ Logging estándar | ⚠️ Firebase Console |

**Veredicto:** La combinación Node.js/Express + PostgreSQL + React representa el equilibrio óptimo entre control técnico, madurez del ecosistema, productividad del equipo y requisitos no funcionales del sistema para este proyecto.

---

## 6. Principios de Ingeniería Aplicados

Esta arquitectura encarna los siguientes principios de ingeniería de software:

1. **Single Responsibility Principle (SRP):** Cada componente (Router, Controller, Service, Repository) tiene una única responsabilidad bien definida.

2. **Separation of Concerns (SoC):** El frontend no conoce la implementación del backend (solo la interfaz de la API), y el backend no conoce cómo se renderiza la UI.

3. **Don't Repeat Yourself (DRY):** El cliente de Axios centraliza la comunicación HTTP; el logger centraliza el registro de eventos; el manejador de errores global centraliza el tratamiento de excepciones.

4. **Fail Fast:** El servidor valida las entradas al inicio del flujo de procesamiento (middlewares de validación) antes de llegar a la lógica de negocio o la base de datos.

5. **Defense in Depth:** La seguridad se implementa en múltiples capas: validación de inputs, autenticación JWT, autorización por roles, rate limiting, headers de seguridad (helmet), CORS restrictivo.

6. **12-Factor App:** La arquitectura sigue los principios de la aplicación de 12 factores para aplicaciones cloud-native: configuración por variables de entorno, procesos stateless, logs como flujos de eventos, paridad dev/producción.

---

*Este documento debe ser complementado con el Skill `skill_modificar_sustento.txt` para vincular cada ventaja técnica con las necesidades específicas del caso de negocio del examen.*
