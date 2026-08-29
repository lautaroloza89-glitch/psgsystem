# Modelo de datos

> Modelo base del Módulo 2, implementado en `supabase/migrations/20260817120000_modelo_datos_inicial.sql`.
> Extendido en el Módulo 5 (`supabase/migrations/20260818150000_users_dicta_clases.sql`) con la columna `dicta_clases` en `users`, necesaria para el formulario de turnos.
> Extendido en la corrección mobile del 2026-08-19 (`supabase/migrations/20260819120000_turnos_capacidad_opcional.sql`): `turnos.capacidad` deja de ser `not null` — se sacó del formulario de "Nueva Clase / Turno" y "Editar turno", la columna se mantiene por si se vuelve a usar más adelante.
> Extendido el 2026-08-22 (`supabase/migrations/20260822120000_roles_head_coach_patinador.sql`): nuevos roles de permiso `Head Coach` y `Patinador`, y columna `cargo` (descriptiva, sin efecto en permisos) en `users`. Detalle en `docs/roles-actualizacion.md`.
> Extendido el 2026-08-25 (`supabase/migrations/20260825150000_notificaciones.sql`, Módulo 7 — Sesión 1): tabla nueva `notificaciones` con trigger de "tarea asignada" sobre `tarea_asignados`.
> Extendido el 2026-08-26 (`supabase/migrations/20260826120000_notificaciones_comentario_nuevo.sql`, Módulo 7 — Sesión 2): trigger de "comentario nuevo" sobre `tarea_comentarios`, misma tabla `notificaciones`.
> Extendido el 2026-08-26 (`supabase/migrations/20260826130000_notificaciones_vencimiento.sql`, Módulo 7 — Sesión 3): chequeo periódico (pg_cron) de tareas por vencer/vencidas, misma tabla `notificaciones`.
> Extendido el 2026-08-27 (`supabase/migrations/20260827120000_notificaciones_push.sql`, Módulo 7 — Sesión 4): tabla nueva `push_subscriptions` + trigger `notificaciones_push` que manda un push real por cada fila nueva de `notificaciones`, cubriendo los 3 tipos existentes. Cierra el Módulo 7.
> Extendido el 2026-08-29 (auditoría Fase B, sesión 2/3 — `docs/auditoria-fase-b-2-db-aditivo.md`): `supabase/migrations/20260829120000_indices_alto_uso.sql` agrega índices sobre columnas de alto uso (ver sección "Índices" más abajo); `20260829130000_notificaciones_delete_admin.sql` agrega policy de `delete` a `notificaciones`; `20260829140000_dicta_clases_default_profesor.sql` corrige `handle_new_user` para que setee `dicta_clases = true` en el alta cuando el rol es `'Profesor'` (antes solo lo hacía un `update` puntual en la migración original de la columna, así que los Profesores dados de alta después quedaban en `false`).
> Extendido el 2026-08-29 (auditoría Fase B, sesión 3/3 — `docs/auditoria-fase-b-3-db-decisiones.md`): `supabase/migrations/20260829150000_notificaciones_tarea_id_set_null.sql` cambia `notificaciones.tarea_id` de `on delete cascade` a `on delete set null` (mismo patrón que `tareas.created_by`/`turnos.profesor_id`) para que borrar una tarea no destruya el historial de notificaciones de otros usuarios; `20260829160000_notificar_tarea_sin_responsables.sql` agrega el trigger `notificar_tarea_sin_responsables` sobre `tarea_asignados` (ver detalle en la sección `notificaciones` más abajo). El hallazgo de `turnos.grupo_nivel` (texto libre sin catálogo) se dejó sin cambios de esquema — decisión del usuario, ver "Decisiones tomadas".
> Extendido el 2026-08-29 (Fase 1.2, Sesión 1 — extensión de notificaciones a Clases/Turnos): `supabase/migrations/20260829170000_notificaciones_comentario_turno.sql` crea la tabla nueva `turno_comentarios` (Clases/Turnos no tenía ningún feature de comentarios hasta esta sesión), agrega la columna `notificaciones.turno_id`, y suma el trigger `notificar_comentario_turno_nuevo` sobre `turno_comentarios`. Ver detalle en las secciones `turno_comentarios` y `notificaciones` más abajo.

## Decisiones tomadas

- **Tareas y proyectos son la misma entidad**: una sola tabla `tareas`, sin jerarquía padre-hijo.
- **Una tarea puede tener varios responsables**: relación muchos a muchos vía `tarea_asignados`.
- **El comentario del Empleado se guarda como historial**: tabla `tarea_comentarios` (no se sobreescribe, se acumula).
- **Los turnos son por fecha puntual, no por día de la semana recurrente**: cada fila de `turnos` es una ocurrencia concreta con su propia `fecha`, para poder cancelar un día puntual (lluvia, feriado) sin afectar el resto del horario.
- **RLS (Row Level Security) está habilitada en las 5 tablas, con políticas por rol definidas en el Módulo 3** (`supabase/migrations/20260817140000_auth_roles_rls.sql`): Admin ve/edita todo; Profesor gestiona las tareas que creó o donde está asignado, y sus propios turnos; Empleado ve solo lo asignado a él, puede cambiar el estado de su tarea (bloqueado a nivel trigger para el resto de las columnas) y comentar; todos los usuarios autenticados pueden ver la tabla `users` completa y todos los `turnos` (horario compartido de la escuela). `service_role` sigue teniendo acceso completo. Extendido el 2026-08-22 (`supabase/migrations/20260822120000_roles_head_coach_patinador.sql`): Head Coach tiene los mismos permisos que Profesor sobre lo propio, más lectura de las tareas/turnos de Profesor, Empleado y Patinador; Patinador tiene los mismos permisos que Empleado.
- **`turnos.grupo_nivel` sigue siendo texto libre, sin tabla de catálogo** (decisión del usuario, auditoría Fase B sesión 3/3, 2026-08-29): con solo 4 valores distintos hoy, sin duplicados, no se justifica la complejidad de una tabla `grupos_nivel` nueva. Si el volumen de valores crece y aparece fragmentación real (variantes tipográficas del mismo nivel), revisar esta decisión.

## Tablas

### `users`

Perfil de cada usuario de la app, ligado 1 a 1 con `auth.users` (Supabase Auth, a implementarse en el Módulo 3).

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` | PK, FK a `auth.users(id)`, `on delete cascade` |
| `email` | `text` | `not null`, `unique` |
| `nombre` | `text` | `not null` |
| `rol` | `text` | `not null`, check: `'Admin' \| 'Profesor' \| 'Empleado' \| 'Head Coach' \| 'Patinador'` |
| `dicta_clases` | `boolean` | `not null`, default `false` (Módulo 5). No es un rol de permisos: distingue, entre los usuarios que pueden figurar como profesor de un turno, a los `Admin` que además dictan clases (ej. la Head Coach) de los que no (ej. la Secretaria). Todo `rol = 'Profesor'` lo tiene en `true`, seteado por `handle_new_user` en el alta (corregido 2026-08-29, ver nota abajo) o, para las cuentas creadas antes de la corrección, por el `update` puntual de la migración correspondiente. |
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

### `turno_comentarios`

Historial de comentarios cortos de un turno (Fase 1.2, Sesión 1 — no existía hasta esta sesión, se creó mirando `tarea_comentarios`).

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `turno_id` | `uuid` | FK a `turnos(id)`, `on delete cascade` |
| `autor_id` | `uuid` | FK a `users(id)`, `on delete set null` |
| `comentario` | `text` | `not null` |
| `created_at` | `timestamptz` | default `now()` |

RLS: como el horario ya es de lectura totalmente abierta a cualquier autenticado (`turnos_select_authenticated`), `turno_comentarios_select` también usa `using (true)`. Cualquier autenticado puede comentar (`turno_comentarios_insert`, con `autor_id = auth.uid()`) — mismo nivel de apertura que la lectura del turno. Solo Admin borra (`turno_comentarios_delete_admin`), igual criterio que `tarea_comentarios_delete_admin`.

### `notificaciones`

Notificaciones en tiempo real por usuario (Módulo 7, primera sesión: solo el disparador de "tarea asignada"; comentarios/vencimientos/push se agregan en sesiones futuras del mismo módulo).

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `usuario_id` | `uuid` | FK a `users(id)`, `on delete cascade` — a quién le llega |
| `tipo` | `text` | `not null`, texto libre (ej. `'tarea_asignada'`), no enum, para poder sumar tipos nuevos sin migrar el esquema |
| `mensaje` | `text` | `not null`, texto corto ya armado (ej. "Te asignaron: Físico de las 20hs") |
| `tarea_id` | `uuid` | FK a `tareas(id)`, `on delete set null` (hasta el 2026-08-29 era `cascade` — ver más abajo), opcional — para navegar a la tarea al tocar la notificación |
| `turno_id` | `uuid` | FK a `turnos(id)`, `on delete set null` (Fase 1.2, Sesión 1), opcional — para navegar al turno al tocar la notificación. `NotificacionesBell` prioriza `tarea_id` sobre `turno_id` al navegar, pero una notificación solo trae uno de los dos seteados en la práctica. |
| `leida` | `boolean` | `not null`, default `false` |
| `creado_en` | `timestamptz` | `not null`, default `now()` |

Las filas las crea únicamente el trigger `notificar_tarea_asignada` (security definer, dispara en cada `insert` real sobre `tarea_asignados`) — no hay política RLS de `insert` para la aplicación, mismo patrón que `handle_new_user` sobre `users`. Cada usuario solo puede `select`/`update` (marcar como leída) sus propias notificaciones. Tabla agregada a la publicación `supabase_realtime` para la suscripción en vivo del ícono de campana.

Extendida el 2026-08-29 (auditoría Fase B, sesión 2/3, hallazgo #3 — `supabase/migrations/20260829130000_notificaciones_delete_admin.sql`) con la política `notificaciones_delete_admin`: la tabla no tenía ninguna política de `delete` para ningún rol, hueco no intencional (a diferencia de `push_subscriptions`, donde la falta de `update` sí es una decisión consciente documentada arriba). Confirmado con el usuario: se agrega borrado solo para Admin, mismo criterio que `tarea_comentarios_delete_admin`.

Extendida en el Módulo 7 — Sesión 2 con el trigger `notificar_comentario_nuevo` (security definer, dispara en cada `insert` real sobre `tarea_comentarios`, tipo `'comentario_nuevo'`): notifica a la unión de los responsables asignados (`tarea_asignados`) y el creador de la tarea (`tareas.created_by`), sin duplicados, excluyendo al autor del comentario. Mensaje: `"{Nombre} comentó en: {título}"` (sin el texto del comentario). Decidido con el usuario — no había un criterio previo que lo determinara.

Extendida en el Módulo 7 — Sesión 3 con el chequeo de tareas por vencer/vencidas. A diferencia de las sesiones 1 y 2, no hay un `insert`/`update` que dispare el aviso por sí solo (nada cambia en la fila cuando una tarea "se acerca" a su vencimiento), así que se resuelve con un chequeo periódico en vez de un trigger:

- **Mecanismo**: `pg_cron` (extensión habilitada en esta sesión), job `notificar_tareas_vencimiento_diario` corriendo `0 11 * * *` (11:00 UTC = 08:00 Argentina, sin horario de verano), que llama a la función `public.notificar_tareas_vencimiento()` (security definer).
- **Umbral**: como `fecha_vencimiento` es `date` (sin hora), el cálculo es en días completos, no en horas — `fecha_vencimiento - fecha de hoy`. Genera tipo `'tarea_por_vencer_2d'` cuando faltan 2 días, `'tarea_por_vencer_1d'` cuando falta 1 día, y `'tarea_vencida'` cuando la fecha ya pasó. Solo evalúa tareas con `estado in ('Pendiente', 'En progreso')` (las `'Completada'` quedan excluidas aunque tengan `fecha_vencimiento` pasada).
- **Destinatarios**: mismo criterio que la Sesión 2 — unión de responsables asignados (`tarea_asignados`) y creador de la tarea (`tareas.created_by`), sin duplicados. A diferencia de las sesiones 1 y 2 no se excluye a nadie (no hay un "autor de la acción" que disparó el aviso, es un chequeo del sistema).
- **Una sola vez por umbral**: antes de insertar, la función chequea que no exista ya una notificación con el mismo `(tarea_id, usuario_id, tipo)` — así una tarea que sigue pendiente después de avisar "vence en 2 días" no repite ese mismo aviso en los chequeos diarios siguientes, pero sí puede generar después el aviso de "vence mañana" y luego el de "vencida" (son tres `tipo` distintos).
- Mensajes: `"Vence en 2 días: {título}"`, `"Vence mañana: {título}"`, `"Venció: {título}"`.

Extendida el 2026-08-29 (auditoría Fase B, sesión 3/3, hallazgos #2 y #3 — `docs/auditoria-fase-b-3-db-decisiones.md`):

- **`tarea_id` pasa de `on delete cascade` a `on delete set null`** (`20260829150000_notificaciones_tarea_id_set_null.sql`): antes, borrar una tarea borraba también las notificaciones de todos los usuarios que la tenían asociada (leídas o no), como efecto colateral sin relación con quien hizo el borrado. Ahora la notificación sobrevive con `tarea_id = null` — mismo patrón que `tareas.created_by`/`turnos.profesor_id`. Recomendación de Claude, confirmada por el usuario.
- **Trigger nuevo `notificar_tarea_sin_responsables`** (`20260829160000_notificar_tarea_sin_responsables.sql`, security definer, `after delete on tarea_asignados`): cuando una tarea queda con 0 responsables tras un borrado (típicamente al borrar un usuario, `tarea_asignados` cascadea sus asignaciones sin ningún aviso), notifica a todos los usuarios con `rol = 'Admin'`, tipo `'tarea_sin_responsables'`, mensaje `"Quedó sin responsables: {título}"`. No dispara si la tarea también fue borrada en la misma operación (cascade desde `tareas`) — chequea que la tarea todavía exista antes de notificar. Cubre cualquier delete sobre `tarea_asignados` que deje una tarea sin responsables, no solo el borrado de usuario (ej. también una reasignación manual que quite al último responsable).

Decidido con el usuario (2026-08-26): esquema de días en vez de horas (la propuesta inicial de "48hs/16hs antes" no se podía calcular con precisión porque `fecha_vencimiento` no tiene componente de hora); mecanismo `pg_cron` en vez de chequeo al cargar el dashboard (recomendado por Claude, para que el aviso llegue aunque nadie abra la app ese día); incluir vencidas en esta misma sesión (ya estaba en el alcance del punto 5 de `PROGRESS.md`); destinatarios = asignados + creador, igual que la Sesión 2, para mantener el mismo criterio en todo el módulo.

Probado con datos de prueba reales (prefijo `TEST-VENC`, creados y borrados al terminar, 0 restantes confirmado): 5 escenarios — tarea a 2 días (avisa a asignado y creador distintos), tarea a 1 día con creador = asignado (avisa una sola vez, no duplica), tarea vencida (avisa a ambos), tarea completada vencida (no avisa), tarea a 5 días (fuera de umbral, no avisa). Se confirmó además que ejecutar la función dos veces seguidas no duplica ningún aviso (dedup por `tarea_id`/`usuario_id`/`tipo` funcionando).

Extendida el 2026-08-29 (Fase 1.2, Sesión 1) con el trigger `notificar_comentario_turno_nuevo` (security definer, dispara en cada `insert` real sobre `turno_comentarios`, tipo `'comentario_turno_nuevo'`): a diferencia de la Sesión 2 de Tareas (destinatarios = asignados + creador), un turno solo tiene un `profesor_id` (no una relación M:N), así que el único destinatario es el profesor asignado al turno, excluido si es quien comentó; si el turno no tiene profesor asignado, no se genera ninguna notificación. Mensaje: `"{Nombre} comentó en el turno: {grupo_nivel}"`. El trigger de push (`notificaciones_push`, Módulo 7 — Sesión 4) no distingue por `tipo`, así que este tipo nuevo ya queda cubierto sin ningún cambio adicional.

### `push_subscriptions`

Suscripciones de Web Push por usuario y navegador/dispositivo (Módulo 7, Sesión 4).

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `usuario_id` | `uuid` | FK a `users(id)`, `on delete cascade` |
| `endpoint` | `text` | `not null`, `unique` — URL del push service del navegador, identifica la suscripción |
| `p256dh` | `text` | `not null` — clave pública de cifrado de la suscripción |
| `auth` | `text` | `not null` — secreto de autenticación de la suscripción |
| `created_at` | `timestamptz` | default `now()` |

RLS: cada usuario ve, crea y borra solo sus propias filas (`select`/`insert`/`delete` con `usuario_id = auth.uid()`). No hay política de `update` — el guardado desde el frontend usa `upsert(..., { onConflict: "endpoint", ignoreDuplicates: true })`, que solo necesita `insert` (si el endpoint ya existe, no hace nada, en vez de reasignar el dueño). Limitación conocida y aceptada: si dos usuarios distintos se loguean en el mismo navegador/dispositivo, el endpoint sigue asociado al primero que se suscribió — caso raro para un equipo de 10 personas con dispositivos propios, no se resolvió para no agregar una política de `update` más permisiva sin necesidad real.

**Mecanismo de envío**: trigger nuevo `notificaciones_push` (`after insert on notificaciones`, security definer) — no reemplaza ni toca los triggers de las sesiones 1-3, se engancha directo a `notificaciones` para cubrir los 3 tipos existentes sin duplicar lógica por tipo. Llama de forma asíncrona (extensión `pg_net`, instalada en esta sesión) a una Edge Function nueva `send-push` (`supabase/functions/send-push/index.ts`, Deno + librería `web-push`), que busca las suscripciones del `usuario_id` y les manda el push; si una suscripción devuelve 404/410 (vencida/inválida), se borra sola. La llamada del trigger a la función va protegida con un secreto compartido (header `x-push-secret`), guardado en `supabase_vault` (extensión ya habilitada, sin uso hasta esta sesión) del lado de la base y como secret de la Edge Function del otro — así la función no queda abierta a cualquiera que descubra su URL pública. Claves VAPID generadas en esta sesión (`NEXT_PUBLIC_VAPID_PUBLIC_KEY` en `.env.local`, privada como secret de la función).

**Frontend**: `public/sw.js` (Service Worker nuevo — el proyecto no tenía ninguno pese a estar pensado como PWA desde el Módulo 1) escucha `push` (muestra la notificación) y `notificationclick` (navega a la tarea o al dashboard). `src/lib/push/subscribe.ts` pide permiso del navegador y se suscribe; se dispara automáticamente al loguearse (`src/app/(auth)/login/page.tsx`), sin bloquear la navegación al dashboard. `src/lib/push/actions.ts` guarda la suscripción.

## Índices

Además de los índices implícitos de las PK/FK y de los 2 explícitos ya existentes (`notificaciones(usuario_id, creado_en)`, `push_subscriptions(usuario_id)`), la auditoría Fase B (sesión 2/3) sumó índices sobre las columnas de mayor uso en filtros/joins de la aplicación (`create index concurrently`, aditivo, no cambia comportamiento):

- `tareas.estado`, `tareas.fecha_vencimiento`, `tareas.created_by`
- `turnos.profesor_id`, `turnos.fecha`
- `tarea_comentarios.tarea_id`

Fase 1.2 (Sesión 1) sumó, ya en la migración que crea la tabla (no como ajuste posterior de auditoría): `turno_comentarios.turno_id`.

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
                │
                └──< turno_comentarios (autor_id) >── turnos
```

## Fuera de alcance de este módulo

- No hay tabla de alumnos/inscriptos: `capacidad` en `turnos` es solo un número, no hay roster de estudiantes (fuera del alcance del proyecto según el resumen general).
- No hay lógica de aplicación de negocio (queries de Tareas/Horarios, hooks) — eso es de los Módulos 4 y 5.
