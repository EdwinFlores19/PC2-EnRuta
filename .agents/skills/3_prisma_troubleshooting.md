# Skill — Prisma Database Troubleshooting (SRE)

## Diagnóstico del Error de Puerto Inválido
Si los logs de producción en Render o la consola de desarrollo del backend muestran el siguiente crash crítico:

```
PrismaClientInitializationError: invalid port number in database URL. Please check the string for any illegal characters.
```

## Causa Raíz
Este error se debe exclusivamente a un problema de parseo del URL por parte del driver de base de datos (`pg` o `PrismaClient` usando `new URL()`). 
Ocurre cuando:
1. La contraseña del usuario de PostgreSQL en Supabase contiene caracteres especiales (por ejemplo: `?`, `@`, `:`, `/`).
2. El caracter `?` o `@` actúa como un delimitador sintáctico en la especificación de URLs, lo que confunde al analizador haciéndole creer que el puerto es inválido o no existe.
3. Se han dejado corchetes o placeholders literales como `[PASSWORD]` o `[REF]`.

## Resolución (Instrucciones para Agentes de IA)
Si detectas este error, **NO intentes modificar el código fuente de TypeScript ni la inicialización de base de datos**. El código está blindado y es correcto.

Debes notificar de inmediato al desarrollador humano con el siguiente mensaje de acción correctiva:

> 🛠️ **Acción Humana Requerida:**  
> Tu contraseña de Supabase contiene caracteres especiales no codificados (como el caracter `?` al final de tu contraseña `PracticaCalificada3?`).
> 
> Para solucionarlo, accede a tus archivos de entorno local o al panel de variables de entorno de Render y **codifica en formato URL la contraseña**.
> 
> Reemplaza el caracter `?` con su equivalente URL-encoded: **`%3F`**  
> (Ejemplo: `PracticaCalificada3?` -> `PracticaCalificada3%3F`).
