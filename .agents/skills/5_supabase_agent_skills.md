# Skill — Supabase Agent Skills & Postgres Best Practices (2026 Edition)

## Propósito
Integrar las directrices oficiales de **Supabase Agent Skills & Postgres Best Practices** (lanzadas en abril de 2026) en el desarrollo autónomo de nuestro proyecto. Este documento instruye a cualquier agente de IA sobre cómo evitar errores de base de datos recurrentes de forma proactiva.

---

## 🛡️ Directrices de Diseño de Base de Datos y SRE (Supabase)

### 1. Indexación Obligatoria de Claves Foráneas (FK)
*   **El Problema:** PostgreSQL, a diferencia de otros motores de base de datos, **no crea índices de forma automática en los campos de claves foráneas**. Si un agente crea un modelo (como `Product` con un campo `userId`), realizar consultas de filtros o borrados en cascada provocará **Sequential Scans (Full Table Scans)** lentos y bloqueos de tablas.
*   **La Regla:** Para cada relación `@relation` definida en `schema.prisma`, es obligatorio agregar un índice explícito (`@@index`) en el campo FK.
    *   *Ejemplo Correcto:*
        ```prisma
        model Product {
          id        String  @id @default(uuid())
          name      String
          userId    String
          user      User    @relation(fields: [userId], references: [id])
          isDeleted Boolean @default(false)

          @@index([userId]) // <--- ÍNDICE OBLIGATORIO PARA EVITAR SEQUENTIAL SCANS
          @@map("products")
        }
        ```

### 2. Evitar la Saturación de Conexiones (Supavisor / Connection Pooling)
*   **El Problema:** La base de datos física reside en Supabase y tiene límites en el número de conexiones simultáneas. Si levantamos múltiples instancias o procesos de larga duración conectándose directamente al puerto `5432` (Session Mode), saturaremos las conexiones disponibles.
*   **La Regla:**
    *   En producción (Render), el backend Express **DEBE** conectarse a través del Connection Pooler (Supavisor) en el puerto `6543` (Transaction Mode) utilizando el parámetro `pgbouncer=true` o similar.
    *   Formato correcto para Render:
        `postgresql://postgres.bkoxlytgdblskafywnxs:[URL_ENCODED_PASSWORD]@aws-1-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true`
    *   El Handshake SSL debe estar habilitado y las conexiones deben cerrarse limpiamente con `prisma.$disconnect()` en el *graceful shutdown* del servidor.

### 3. Codificación de Contraseña (URL-Encoding) en la Cadena de Conexión
*   **El Problema:** El analizador sintáctico `new URL()` de Node.js interpretará caracteres especiales (como `?`, `@`, `/`, `:`) en la contraseña del URL de PostgreSQL como delimitadores sintácticos del protocolo, causando fallos de parseo críticos (`invalid port number in database URL`).
*   **La Regla:** Cualquier caracter especial en la contraseña **DEBE ser codificado en formato URL** antes de ensamblar la URL de conexión.
    *   *Ejemplo:* Contraseña real: `PracticaCalificada3?` -> Debe escribirse como: `PracticaCalificada3%3F`

### 4. Migraciones Seguras de DDL (Zero Table-Locking)
*   **El Problema:** Ejecutar comandos de alteración de tablas (`ALTER TABLE`) para añadir columnas no-nullables con valores por defecto complejos bloquea la tabla para escritura, causando un cuello de botella en producción.
*   **La Regla:** Siempre añade nuevas columnas como opcionales (`?` en Prisma) o con valores por defecto constantes simples. Si requieres rellenar registros históricos, hazlo en un script secundario secuencial después de aplicar el cambio de esquema.

---

## 🛠️ Procedimiento de Auditoría en Vivo (Query Tuning)

Cuando detectes lentitud en un endpoint o estés optimizando el rendimiento de persistencia, ejecuta el siguiente protocolo mediante el MCP Supabase/PostgreSQL:

1.  **pg_stat_statements:** Consulta las queries más lentas de la base de datos:
    ```sql
    SELECT query, total_exec_time, calls, rows 
    FROM pg_stat_statements 
    ORDER BY total_exec_time DESC LIMIT 5;
    ```
2.  **EXPLAIN ANALYZE:** Corre un plan de ejecución de consulta en cualquier query sospechosa para verificar si existe un sequential scan:
    ```sql
    EXPLAIN ANALYZE SELECT * FROM "products" WHERE "userId" = 'uuid-de-prueba';
    ```
3.  **Indexación Correctiva:** Si el query planner muestra `Seq Scan`, genera un índice correctivo de inmediato y agrégalo en tu schema de Prisma para mantener la sincronía del modelo relacional.
