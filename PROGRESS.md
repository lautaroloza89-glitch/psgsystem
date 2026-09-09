# 🎯 PROGRESS — Sistema de Gestión · Escuela de Patín

> **Para Claude Code: leé este archivo completo ANTES de escribir código.**
> Este documento es la fuente de verdad del **estado** del proyecto. Actualizá la tabla del punto 1 al terminar un módulo, y agregá la línea de la sesión en el historial del mes (`docs/historial/YYYY-MM.md`).

**Dónde está cada cosa:**

| Documento | Qué contiene |
|---|---|
| **`PROGRESS.md`** (este archivo) | Estado de cada módulo + reglas de trabajo + índice del historial. |
| `docs/decisiones.md` | Decisiones de producto vigentes (alcances, reglas de permisos, criterios de negocio). |
| `docs/pendientes.md` | Trabajo vivo pendiente que no bloquea nada. |
| `docs/historial/YYYY-MM.md` | Log de sesiones archivado, un archivo por mes. |
| `docs/roadmap-general.md` | Plan por fases (sin estado por módulo — eso vive acá). |
| `docs/modelo-datos.md` | Tablas, campos, índices, RLS y triggers. |

> **Nota de equivalencia para documentos viejos:** algunos docs de sesiones anteriores citan "el punto 5 de `PROGRESS.md`" (la tabla de módulos, hoy el punto 1) y "el punto 8" o "el Log de sesiones" (hoy `docs/historial/`). Los puntos 1-4 y 7 originales (resumen del proyecto, roles, stack, estructura de carpetas y estado actual) se movieron a `docs/decisiones.md` y `docs/pendientes.md`.

---

## 1. Estado de los módulos

⚠️ No mezclar módulos en la misma sesión. Terminar, probar, commitear, recién ahí seguir. Esto evita saturar el chat y facilita corregir errores de forma aislada.

### Fase 1 — Base del sistema (cerrada)

| # | Módulo | Depende de | Estado |
|---|---|---|---|
| 1 | Setup base (proyecto, config, deploy vacío) | — | ✅ Terminado |
| 2 | Modelo de datos (tablas en Supabase) | 1 | ✅ Terminado |
| 3 | Auth + roles | 2 | ✅ Terminado |
| 4 | Módulo Tareas | 3 | ✅ Terminado |
| 5 | Módulo Clases/Turnos | 3 | ✅ Terminado |
| 6 | Dashboard | 4, 5 | ✅ Terminado |
| 7 | Notificaciones (asignación, comentario, vencimiento, push) | 4, 5 | ✅ Terminado |

### Fase 2 — Gestión del club (cerrada)

| # | Módulo | Depende de | Estado |
|---|---|---|---|
| GW1 | Groundwork: grupos, horarios de grupo, alumnas, contactos | Fase 1 | ✅ Terminado |
| GW2 | Groundwork: clases atadas a grupos por FK real | GW1 | ✅ Terminado |
| GW3 | Groundwork: varios profesores por clase + notificación de asignación | GW2 | ✅ Terminado |
| F2 MOD 1 | Planificaciones | GW1, GW2 | ✅ Terminado |
| F2 MOD 2 | Alumnas | GW1 | ✅ Terminado |
| F2 MOD 3 | Pagos y cuotas | F2 MOD 2 | ✅ Terminado |
| F2 MOD 4 | Asistencia | F2 MOD 2 | ✅ Terminado |
| F2 MOD 5 | Torneos (solo registro) | GW1 | ✅ Terminado |
| — | Correcciones pre-UI (5 bloques) | Fase 2 completa | ✅ Terminado |

### Lo que sigue

| # | Módulo | Depende de | Estado |
|---|---|---|---|
| — | **UI nueva** (rediseño de la interfaz) | Correcciones pre-UI | 🟡 En progreso — 7 de 8 módulos, ver [docs/diseno/estado-del-rediseno.md](docs/diseno/estado-del-rediseno.md) |
| — | Participación en torneos: las 3 pantallas (el modelo ya está) — es el módulo 8, el último del rediseño | UI nueva | ⬜ Pendiente |
| — | Reenvío de recibo de pago (el campo ya está) | UI nueva | ⬜ Pendiente |

Estados: ⬜ Pendiente · 🟡 En progreso · ✅ Terminado

## 2. Reglas de trabajo para Claude Code

1. Al empezar una sesión: leer este archivo completo y ubicar el primer módulo no terminado en la tabla del punto 1.
2. Trabajar SOLO ese módulo. No adelantar código de módulos futuros.
3. Al terminar: actualizar el estado en la tabla del punto 1 y agregar la fila de la sesión en el historial del mes en curso (`docs/historial/YYYY-MM.md`; si el archivo del mes no existe, crearlo y sumar la línea correspondiente al índice del punto 3).
4. No modificar módulos ya marcados ✅ salvo pedido explícito del usuario.
5. Si falta una decisión de producto no definida en `docs/decisiones.md`, preguntar antes de asumir.
6. Al cerrar el módulo, sugerir un mensaje de commit corto y claro.
7. **No reestructurar este documento** (agregar/quitar/fusionar módulos, cambiar el sistema de estados, etc.) sin pedido explícito del usuario. Si un módulo cambia de alcance, avisar en el chat en vez de reescribir la tabla del punto 1.
8. Cada cosa en su archivo: el **estado** de un módulo va en la tabla del punto 1; una **decisión de producto** vigente, en `docs/decisiones.md`; un **pendiente** que queda abierto, en `docs/pendientes.md`; el **relato de la sesión**, en el historial del mes. No duplicar lo mismo en dos lugares.

## 3. Historial archivado

| Mes | Resumen | Archivo |
|---|---|---|
| 2026-08 | Arranque del proyecto y cierre completo de Fase 1 (setup, modelo de datos, auth y roles, Tareas, Clases, Dashboard, Notificaciones con push), auditoría Fase B y groundwork de Fase 2 con Planificaciones. | [docs/historial/2026-08.md](docs/historial/2026-08.md) |
| 2026-09 | Cierre de Fase 2 (Alumnas, Pagos, Asistencia y Torneos), import de las 158 alumnas reales, los 5 bloques de Correcciones pre-UI, la reorganización de la documentación y el arranque del rediseño de la interfaz en la rama `nueva-ui` (módulos 1 a 6). | [docs/historial/2026-09.md](docs/historial/2026-09.md) |
