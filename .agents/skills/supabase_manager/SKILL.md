---
name: supabase-database-manager
description: >
  Gestiona la base de datos PostgreSQL en Supabase usando el MCP de Supabase.
  Úsalo para: aplicar migraciones de Prisma, ejecutar queries SQL, verificar el schema,
  inspeccionar datos, hacer debug de problemas de base de datos, y verificar la
  normalización del modelo de datos. Activar cuando el usuario diga "aplica la migración",
  "verifica la base de datos", "ejecuta SQL", "inspecciona las tablas" o "diagnóstica la BD".
---

# Skill: Supabase Database Manager

## Configuración del MCP

El MCP de Supabase ya está configurado globalmente en tu sistema:
```
C:\Users\ejuni\.gemini\config\mcp_config.json
→ "supabase": { "serverUrl": "https://mcp.supabase.com/mcp" }
```

Autenticarse en Supabase cuando el cliente AI lo solicite via OAuth.

## Caso de Uso 1: Verificar Schema Después de Migración

```
INSTRUCCIÓN PARA EL AGENTE:
Después de ejecutar 'npx prisma migrate dev', usar el MCP de Supabase para:

1. Listar todas las tablas del schema 'public'
2. Para cada tabla del modelo de negocio, verificar:
   - Las columnas existen con los tipos correctos
   - Las claves primarias (UUID) están configuradas
   - Las claves foráneas (FK) apuntan a las tablas correctas
   - Los índices están creados en los campos relevantes
3. Ejecutar: SELECT table_name, column_name, data_type FROM information_schema.columns
   WHERE table_schema = 'public' ORDER BY table_name, ordinal_position;
4. Reportar cualquier discrepancia con el schema de Prisma
```

## Caso de Uso 2: Verificar Normalización 3FN

```
INSTRUCCIÓN PARA EL AGENTE:
Usando el MCP de Supabase, verificar que el modelo de datos cumple 3FN:

VERIFICACIÓN 1FN:
  - No hay columnas con múltiples valores separados por comas
  - Cada columna tiene un tipo de dato específico (no TEXT para todo)

VERIFICACIÓN 2FN:
  - Las tablas con PKs compuestas no tienen columnas que dependan solo de una parte
  - Las entidades tienen sus propias tablas (no hay datos mezclados)

VERIFICACIÓN 3FN:
  - Identificar columnas que podría tener dependencia transitiva
  - Por ejemplo: si tenemos (ciudad, país, código_postal), ciudad depende de código_postal
    → Esto debería ser una tabla separada de Ubicaciones

Ejecutar:
  SELECT conname, contype, pg_get_constraintdef(oid)
  FROM pg_constraint
  WHERE conrelid IN (
    SELECT oid FROM pg_class WHERE relschema = 'public'
  );
```

## Caso de Uso 3: Insertar Datos de Prueba

```
INSTRUCCIÓN PARA EL AGENTE:
Para poder probar los endpoints, insertar datos de prueba:

1. Crear usuario administrador:
   INSERT INTO users (id, email, password, name, role, is_active)
   VALUES (gen_random_uuid(), 'admin@test.com', '$2b$12$[HASH]', 'Admin Test', 'ADMIN', true);

2. NOTA: La contraseña debe ser hasheada con bcrypt antes de insertar.
   Usar el helper: node -e "const b=require('bcryptjs'); b.hash('Admin123!',12).then(console.log)"
   
3. Insertar datos de ejemplo para las entidades principales del caso de negocio.
```

## Caso de Uso 4: Diagnóstico de Performance

```
INSTRUCCIÓN PARA EL AGENTE:
Si hay queries lentas, usar el MCP de Supabase para:

1. Verificar índices existentes:
   SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = 'public';

2. Ejecutar EXPLAIN ANALYZE en queries problemáticas:
   EXPLAIN ANALYZE SELECT * FROM [tabla] WHERE [condicion];

3. Verificar estadísticas de uso:
   SELECT schemaname, tablename, n_live_tup, n_dead_tup
   FROM pg_stat_user_tables ORDER BY n_live_tup DESC;
```

## Caso de Uso 5: Aplicar Migración de Emergencia

```
INSTRUCCIÓN PARA EL AGENTE:
Si se necesita un cambio de schema sin crear una migración de Prisma:

1. Ejecutar el SQL directamente en Supabase via MCP:
   ALTER TABLE [tabla] ADD COLUMN [nombre] [tipo] DEFAULT [valor];

2. Actualizar el schema de Prisma (prisma/schema.prisma) para reflejar el cambio.

3. Ejecutar: npx prisma db pull
   (introspección para sincronizar Prisma con la BD real)

4. Ejecutar: npx prisma generate
   (regenerar el cliente)

NOTA: Esta es una solución de emergencia. El procedimiento normal es:
  npx prisma migrate dev --name [nombre_migracion]
```

## Caso de Uso 6: Diagnóstico de Conexión y Codificación de Caracteres Especiales (SRE)

```
INSTRUCCIÓN PARA EL AGENTE:
Si el backend o Prisma arroja un error crítico de conexión como:
"PrismaClientInitializationError: invalid port number in database URL. Please check the string for any illegal characters."

1. Verificar si la contraseña en DATABASE_URL contiene caracteres especiales como "?" o "@".
2. Si los contiene (por ejemplo: "PracticaCalificada3?"), el agente debe codificarlos en formato URL:
   - "?" debe ser codificado como "%3F"
   - "@" debe ser codificado como "%40"
3. Reemplazar la contraseña en el archivo ".env" del backend con la versión codificada.
   Ejemplo:
     Contraseña real: PracticaCalificada3?
     Contraseña en DATABASE_URL: PracticaCalificada3%3F
```

## Comandos Útiles de Prisma

```bash
# Ver estado de las migraciones
npx prisma migrate status

# Aplicar migraciones pendientes en producción
npx prisma migrate deploy

# Resetear la base de datos (SOLO DESARROLLO)
npx prisma migrate reset

# Abrir Prisma Studio (GUI para la BD)
npx prisma studio

# Verificar el schema sin aplicar cambios
npx prisma validate
```
