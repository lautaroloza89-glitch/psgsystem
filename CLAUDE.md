# PSG System — Sistema de Gestión · Escuela de Patín

App interna del club: Next.js + TypeScript + Tailwind sobre Supabase (Postgres, Auth, RLS), desplegada en Vercel. Es una PWA para un equipo de ~10 personas.

## Antes de escribir código

**Leé `PROGRESS.md` completo.** Es la fuente de verdad del estado del proyecto: qué módulo sigue, y las reglas de trabajo sesión a sesión.

Se trabaja **un módulo por sesión**. No adelantar código de módulos futuros ni modificar módulos ya marcados ✅ sin pedido explícito del usuario.

Si falta una decisión de producto, **preguntá antes de asumir** — no elijas el modelo "más simple" en silencio.

## Dónde va cada cosa

La documentación está separada a propósito. **No mezclar**, y no duplicar lo mismo en dos archivos:

| Archivo | Qué va ahí | Qué NO va ahí |
|---|---|---|
| `PROGRESS.md` | El **estado** de cada módulo (tabla), las reglas de trabajo, el índice del historial. | El log de sesiones. Las decisiones de producto. Los pendientes. |
| `docs/historial/YYYY-MM.md` | El **relato de cada sesión**: una fila en la tabla del mes en curso, al cerrar. | Estado vigente de nada. |
| `docs/decisiones.md` | Las **decisiones de producto vigentes** (alcances, reglas de permisos, criterios de negocio), en formato Decisión / Contexto / Estado. Sin fechas de sesión. | El historial de cómo se llegó. Versiones viejas de una decisión ya reemplazada. |
| `docs/pendientes.md` | El **trabajo abierto** que no bloquea nada (verificaciones pendientes, tareas manuales). | Pendientes ya cerrados — esos se borran de acá y quedan en el historial del mes. |
| `docs/roadmap-general.md` | El plan **por fases**. | El estado módulo por módulo. Eso vive solo en la tabla de `PROGRESS.md`. |
| `docs/modelo-datos.md` | Tablas, campos, índices, RLS, triggers. | — |

> ⚠️ **El log de sesiones ya no vive en `PROGRESS.md`.** Se archivó por mes en `docs/historial/`. Si una skill o un pedido dice "agregá la línea al log de sesiones de `PROGRESS.md`", la línea va igual al historial del mes en curso — no recrear la sección vieja dentro de `PROGRESS.md`.
>
> Los docs de sesiones puntuales (`auditoria-fase-b-*`, `diseno-*`, `correcciones-ui-*`, `plan-*`) son registro histórico congelado: no se actualizan. Algunos citan la numeración vieja de `PROGRESS.md` ("el punto 5", "el punto 8"); la equivalencia está anotada al principio de `PROGRESS.md`.

## Al cerrar una sesión

1. Actualizar el estado del módulo en la tabla de `PROGRESS.md`.
2. Agregar la fila de la sesión en `docs/historial/YYYY-MM.md` (crear el archivo del mes si no existe, y sumar su línea al índice de `PROGRESS.md`).
3. Si se tomó una decisión de producto nueva o cambió una vigente: actualizarla en `docs/decisiones.md`.
4. Si algo queda abierto: anotarlo en `docs/pendientes.md`. Si se cerró un pendiente: borrarlo de ahí y dejar constancia en la fila del historial.
5. Sugerir un mensaje de commit corto y claro.

## Cosas del entorno que muerden

- **No correr `next build` con un `next dev` activo**: el build pisa `.next` y deja el dev server sirviendo chunks rotos. Bajarlo antes.
- **Migraciones**: se aplican contra el proyecto real vía Management API, en bloques (el endpoint tiene límite de tamaño), y se registran en `supabase_migrations.schema_migrations`.
- **Probar funciones batch/cron con `rollback`**, nunca invocándolas directo contra producción: procesan toda la tabla real, no solo los datos de prueba, y generan notificaciones a usuarios reales.
- **Texto con tildes o ñ hacia la API**: escribir el JSON a un archivo y mandarlo con `curl --data-binary`. Pasarlo inline por bash corrompe el UTF-8.
- **Una migración no aditiva** (ej. un rename de columna) deja producción rota hasta que se pushee el código: pushear es parte de cerrar esa sesión, no un paso para después.
