# Modelo de datos

> Modelo base del Módulo 2, implementado en `supabase/migrations/20260817120000_modelo_datos_inicial.sql`.
> Extendido en el Módulo 5 (`supabase/migrations/20260818150000_users_dicta_clases.sql`) con la columna `dicta_clases` en `users`, necesaria para el formulario de turnos.
> Extendido en la corrección mobile del 2026-08-19 (`supabase/migrations/20260819120000_turnos_capacidad_opcional.sql`): `turnos.capacidad` deja de ser `not null` — se sacó del formulario de "Nueva Clase / Turno" y "Editar turno", la columna se mantiene por si se vuelve a usar más adelante.
> Extendido el 2026-08-22 (`supabase/migrations/20260822120000_roles_head_coach_patinador.sql`): nuevos roles de permiso `Head Coach` y `Patinador`, y columna `cargo` (descriptiva, sin efecto en permisos) en `users`. Detalle en `docs/roles-actualizacion.md`.
> Extendido el 2026-08-25 (`supabase/migrations/20260825150000_notificaciones.sql`, Módulo 7 — Sesión 1): tabla nueva `notificaciones` con trigger de "tarea asignada" sobre `tarea_asignados`.
> Extendido el 2026-08-26 (`supabase/migrations/20260826120000_notificaciones_comentario_nuevo.sql`, Módulo 7 — Sesión 2): trigger de "comentario nuevo" sobre `tarea_comentarios`, misma tabla `notificaciones`.

## Decisiones tomadas

- **Tareas y proyectos son la misma entidad**: una sola tabla `tareas`, sin jerarquía padre-hijo.
- **Una tarea puede tener varios responsables**: relación muchos a muchos vía `tarea_asignados`.
- **El comentario del Empleado se guarda como historial**: tabla `tarea_comentarios` (no se sobreescribe, se acumula).
- **Los turnos son por fecha puntual, no por día de la semana recurrente**: cada fila de `turnos` es una ocurrencia concreta con su propia `fecha`, para poder cancelar un día puntual (lluvia, feriado) sin afectar el resto del horario.
- **RLS (Row Level Security) está habilitada en las 5 tablas, con políticas por rol definidas en el Módulo 3** (`supabase/migrations/20260817140000_auth_roles_rls.sql`): Admin ve/edita todo; Profesor gestiona las tareas que creó o donde está asignado, y sus propios turnos; Empleado ve solo lo asignado a él, puede cambiar el estado de su tarea (bloqueado a nivel trigger para el resto de las columnas) y comentar; todos los usuarios autenticados pueden ver la tabla `users` completa y todos los `turnos` (horario compartido de la escuela). `service_role` sigue teniendo acceso completo. Extendido el 2026-08-22 (`supabase/migrations/20260822120000_roles_head_coach_patinador.sql`): Head Coach tiene los mismos permisos que Profesor sobre lo propio, más lectura de las tareas/turnos de Profesor, Empleado y Patinador; Patinador tiene los mismos permisos que Empleado.

## Tablas

### `users`

Perfil de cada usuario de la app, ligado 1 a 1 con `auth.users` (Supabase Auth, a implementarse en el Módulo 3).

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` | PK, FK a `auth.users(id)`, `on delete cascade` |
| `email` | `text` | `not null`, `unique` |
| `nombre` | `text` | `not null` |
| `rol` | `text` | `not null`, check: `'Admin' \| 'Profesor' \| 'Empleado' \| 'Head Coach' \| 'Patinador'` |
| `dicta_clases` | `boolean` | `not null`, default `false` (Módulo 5). No es un rol de permisos: distingue, entre los usuarios que pueden figurar como profesor de un turno, a los `Admin` que además dictan clases (ej. la Head Coach) de los que no (ej. la Secretaria). Todo `rol = 'Profesor'` lo tiene en `true`. |
| `cargo` | `text` | opcional, texto libre (ej. "Preparadora física", "Ayudante de recepción"). Puramente descriptivo, no afecta permisos — solo se muestra en pantalla junto al rol. |
| `created_at` | `timestamptz` | default `now()` |

### `tareas`

Tareas de trabajo.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `titulo` | `text` | `not null` |
| `descripcion` | `text` | opcional |
| `estado` | `text` | `not null`, default `'Pendiente'`, check: `'Pendiente' \| 'En progreso' \| 'Completada'` |
| `fecha_inicio` | `date` | opcional |
| `fecha_vencimiento` | `date` | opcional |
| `created_by` | `uuid` | FK a `users(id)`, `on delete set null` |
| `created_at` | `timestamptz` | default `now()` |
| `updated_at` | `timestamptz` | default `now()`, se actualiza solo con trigger |

### `tarea_asignados`

Relación muchos a muchos entre `tareas` y `users` (los responsables de cada tarea).

| Columna | Tipo | Notas |
|---|---|---|
| `tarea_id` | `uuid` | FK a `tareas(id)`, `on delete cascade` |
| `usuario_id` | `uuid` | FK a `users(id)`, `on delete cascade` |
| `asignado_en` | `timestamptz` | default `now()` |

PK compuesta: (`tarea_id`, `usuario_id`).

### `tarea_comentarios`

Historial de comentarios cortos de una tarea (ej. el que deja el Empleado al cambiar el estado).

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `tarea_id` | `uuid` | FK a `tareas(id)`, `on delete cascade` |
| `autor_id` | `uuid` | FK a `users(id)`, `on delete set null` |
| `comentario` | `text` | `not null` |
| `created_at` | `timestamptz` | default `now()` |

### `turnos`

Horarios/turnos de la escuela. Cada fila es una ocurrencia puntual (fecha concreta), no un patrón recurrente.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `fecha` | `date` | `not null` |
| `hora_inicio` | `time` | `not null` |
| `hora_fin` | `time` | `not null`, check: `hora_fin > hora_inicio` |
| `grupo_nivel` | `text` | `not null`, texto libre (ej. "Iniciación", "Nivel 2") |
| `capacidad` | `integer` | opcional (ver nota arriba), check: `capacidad > 0` cuando no es null |
| `profesor_id` | `uuid` | FK a `users(id)`, `on delete set null`, opcional |
| `estado` | `text` | `not null`, default `'Activo'`, check: `'Activo' \| 'Cancelado'` |
| `created_at` | `timestamptz` | default `now()` |
| `updated_at` | `timestamptz` | default `now()`, se actualiza solo con trigger |

### `notificaciones`

Notificaciones en tiempo real por usuario (Módulo 7, primera sesión: solo el disparador de "tarea asignada"; comentarios/vencimientos/push se agregan en sesiones futuras del mismo módulo).

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `usuario_id` | `uuid` | FK a `users(id)`, `on delete cascade` — a quién le llega |
| `tipo` | `text` | `not null`, texto libre (ej. `'tarea_asignada'`), no enum, para poder sumar tipos nuevos sin migrar el esquema |
| `mensaje` | `text` | `not null`, texto corto ya armado (ej. "Te asignaron: Físico de las 20hs") |
| `tarea_id` | `uuid` | FK a `tareas(id)`, `on delete cascade`, opcional — para navegar a la tarea al tocar la notificación |
| `leida` | `boolean` | `not null`, default `false` |
| `creado_en` | `timestamptz` | `not null`, default `now()` |

Las filas las crea únicamente el trigger `notificar_tarea_asignada` (security definer, dispara en cada `insert` real sobre `tarea_asignados`) — no hay política RLS de `insert` para la aplicación, mismo patrón que `handle_new_user` sobre `users`. Cada usuario solo puede `select`/`update` (marcar como leída) sus propias notificaciones. Tabla agregada a la publicación `supabase_realtime` para la suscripción en vivo del ícono de campana.

Extendida en el Módulo 7 — Sesión 2 con el trigger `notificar_comentario_nuevo` (security definer, dispara en cada `insert` real sobre `tarea_comentarios`, tipo `'comentario_nuevo'`): notifica a la unión de los responsables asignados (`tarea_asignados`) y el creador de la tarea (`tareas.created_by`), sin duplicados, excluyendo al autor del comentario. Mensaje: `"{Nombre} comentó en: {título}"` (sin el texto del comentario). Decidido con el usuario — no había un criterio previo que lo determinara.

## Relaciones

```
auth.users (Supabase Auth)
    │ 1:1
    ▼
users ──┬──< tareas (created_by)
        │
        ├──< tarea_asignados >── tareas
        │
        ├──< tarea_comentarios (autor_id) >── tareas
        │
        └──< turnos (profesor_id)
```

## Fuera de alcance de este módulo

- No hay tabla de alumnos/inscriptos: `capacidad` en `turnos` es solo un número, no hay roster de estudiantes (fuera del alcance del proyecto según el resumen general).
- No hay lógica de aplicación de negocio (queries de Tareas/Horarios, hooks) — eso es de los Módulos 4 y 5.
