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
> Extendido el 2026-08-31 (Sistema PSG, Fase 2 — Sesión 1: modelo de datos base): `supabase/migrations/20260831120000_f2_grupos_alumnas_contactos.sql` crea 4 tablas nuevas — `grupos`, `grupo_horarios`, `alumnas`, `contactos` — groundwork de Fase 2 (Planificación, gestión de alumnas, cuotas/pagos, asistencia). Sin UI en esta sesión. Ver detalle en las secciones correspondientes más abajo.
> Extendido el 2026-08-31 (Sistema PSG, Fase 2 — Sesión 2: Clases/Turnos por FK real): `supabase/migrations/20260831130000_turnos_grupo_id_fk.sql` renombra `turnos.grupo_nivel` a `grupo_legacy` (deja de ser `not null`) y agrega `turnos.grupo_id` (FK nullable a `grupos`). También actualiza la función del trigger `notificar_comentario_turno_nuevo` (Fase 1.2, Sesión 1) para armar el mensaje con `grupos.nombre` cuando el turno ya está mapeado, con fallback a `grupo_legacy`. Ver detalle en la sección `turnos` más abajo.

## Decisiones tomadas

- **Tareas y proyectos son la misma entidad**: una sola tabla `tareas`, sin jerarquía padre-hijo.
- **Una tarea puede tener varios responsables**: relación muchos a muchos vía `tarea_asignados`.
- **El comentario del Empleado se guarda como historial**: tabla `tarea_comentarios` (no se sobreescribe, se acumula).
- **Los turnos son por fecha puntual, no por día de la semana recurrente**: cada fila de `turnos` es una ocurrencia concreta con su propia `fecha`, para poder cancelar un día puntual (lluvia, feriado) sin afectar el resto del horario.
- **RLS (Row Level Security) está habilitada en las 5 tablas, con políticas por rol definidas en el Módulo 3** (`supabase/migrations/20260817140000_auth_roles_rls.sql`): Admin ve/edita todo; Profesor gestiona las tareas que creó o donde está asignado, y sus propios turnos; Empleado ve solo lo asignado a él, puede cambiar el estado de su tarea (bloqueado a nivel trigger para el resto de las columnas) y comentar; todos los usuarios autenticados pueden ver la tabla `users` completa y todos los `turnos` (horario compartido de la escuela). `service_role` sigue teniendo acceso completo. Extendido el 2026-08-22 (`supabase/migrations/20260822120000_roles_head_coach_patinador.sql`): Head Coach tiene los mismos permisos que Profesor sobre lo propio, más lectura de las tareas/turnos de Profesor, Empleado y Patinador; Patinador tiene los mismos permisos que Empleado.
- **`turnos.grupo_nivel` sigue siendo texto libre, sin tabla de catálogo** (decisión del usuario, auditoría Fase B sesión 3/3, 2026-08-29): con solo 4 valores distintos hoy, sin duplicados, no se justifica la complejidad de una tabla `grupos_nivel` nueva. Si el volumen de valores crece y aparece fragmentación real (variantes tipográficas del mismo nivel), revisar esta decisión.
- **Fase 2 sí tiene una tabla `grupos` real** (Sesión 1, 2026-08-31), a diferencia del punto anterior — son conceptos distintos: `turnos.grupo_nivel` es del dominio de Tareas/Horarios de Fase 1 (4 valores de texto libre, sin cambios); `grupos` es el catálogo fijo de 5 grupos de la escuela para el dominio nuevo de alumnas/cuotas de Fase 2.
- **`turnos.grupo_nivel` se unificó con `grupos` (Fase 1.2, Sesión 2, 2026-08-31)**: la columna se renombró a `grupo_legacy` (texto libre viejo, ahora nullable) y se agregó `turnos.grupo_id` (FK nullable a `grupos`). No se migraron los datos existentes automáticamente — son pocas filas (4 al cierre de esta sesión), Lauti las mapea a mano abriendo cada turno y eligiendo el grupo real en el formulario; recién cuando estén todas mapeadas se dropea `grupo_legacy`. Los turnos nuevos ya se crean solo con `grupo_id` (el formulario no pide más texto libre).
- **El horario de un turno se deriva de `grupo_horarios`, no se tipea a mano**: el formulario ya no tiene campos de hora; al elegir el grupo (y, si tiene más de un bloque como Jungla, el bloque específico) se copian `hora_inicio`/`hora_fin` del bloque elegido al turno en el momento de crear/editar. `turnos.hora_inicio`/`hora_fin` siguen existiendo como columnas propias (no una FK al bloque) porque un turno es una ocurrencia puntual — si el horario de un grupo cambia más adelante, los turnos ya creados no se actualizan retroactivamente, a propósito.
- **`alumnas` son datos puros, sin relación con el rol "Patinador/a" de Fase 1**: entidades separadas a propósito, sin FK ni deduplicación entre ambas. Si una patinadora con login también aparece como alumna, es intencional y lo controla Lauti manualmente.
- **`grupo_horarios.dias` es `smallint[]` con la convención ISO de `extract(isodow from ...)`** (1=lunes … 7=domingo), no una tabla de días ni texto libre — elegido para que sea consultable directamente contra fechas reales (F2 MOD 1 necesita calcular qué fechas del mes caen en cada día de semana; F2 MOD 4 necesita filtrar asistencia por día).
- **Borrar una tarea (Fase 1.2, Sesión 2, 2026-08-31) quedó gateado a Admin solamente a nivel aplicación**, mismo criterio que ya regía para borrar un turno — sin cambios de RLS: la política `tareas_delete` (desde el 2026-08-22) ya permitía también a Profesor/Head Coach borrar lo que ellos mismos crearon, más permisiva que lo que expone la UI. No es un hueco de seguridad (la única vía de borrado de la app es el server action nuevo, que corta en Admin antes de llegar a la base), solo una asimetría entre lo que la RLS permitiría y lo que el botón ofrece — documentado acá por si una sesión futura necesita ampliar el botón a Profesor/Head Coach sobre lo propio, en cuyo caso la RLS ya lo soporta sin otra migración.

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

Horarios/turnos de la escuela. Cada fila es una ocurrencia puntual (fecha concreta), no un patrón recurrente. Desde F2 MOD 1 (2026-08-31) también es la fila donde vive la planificación de esa clase — no se creó una tabla aparte, ver más abajo.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `fecha` | `date` | `not null` |
| `hora_inicio` | `time` | `not null` |
| `hora_fin` | `time` | `not null`, check: `hora_fin > hora_inicio` |
| `grupo_legacy` | `text` | opcional (desde el 2026-08-31, antes `grupo_nivel not null`). Texto libre viejo, anterior a la FK `grupo_id` — se conserva sin borrar hasta que Lauti remapee a mano las filas cargadas antes de esa sesión; recién ahí se dropea. |
| `grupo_id` | `uuid` | FK a `grupos(id)`, `on delete set null`, opcional. Reemplaza a `grupo_legacy` para los turnos nuevos (Fase 1.2, Sesión 2, 2026-08-31) — el formulario ahora es un select contra los 5 grupos reales en vez de texto libre. |
| `capacidad` | `integer` | opcional (ver nota arriba), check: `capacidad > 0` cuando no es null |
| `estado` | `text` | `not null`, default `'Activo'`, check: `'Activo' \| 'Cancelado'` |
| `planificacion` | `text` | opcional (F2 MOD 1, 2026-08-31). Contenido de la clase en markdown, pegado por Luciana desde ChatGPT. Renderizado con `MarkdownText` (títulos, negritas, listas, tablas). |
| `tipo` | `text` | `not null`, default `'Patín'`, check: `'Patín' \| 'Preparación física'` (F2 MOD 1). Separa las planificaciones de patín y de preparación física del mismo grupo en la navegación grupo → mes → planificaciones. |
| `created_at` | `timestamptz` | default `now()` |
| `updated_at` | `timestamptz` | default `now()`, se actualiza solo con trigger |

Índice `turnos_grupo_id_fecha_idx` (`grupo_id`, `fecha`) agregado en F2 MOD 1 para la navegación grupo → mes.

**Modelo de datos de F2 MOD 1 (decisión confirmada con el usuario antes de migrar):** la planificación no es una tabla separada — `turnos` ya era una fila por fecha puntual desde el Módulo 2 (Fase 1), así que agregar `planificacion`/`tipo` ahí reutiliza esa propiedad en vez de duplicarla. La carga con selección de fechas (varios lunes del mes con el mismo contenido) hace un upsert por `grupo_id`+`fecha`: si ya existe un turno para esa fecha, solo actualiza `planificacion`/`tipo`/profesores; si no existe, lo crea derivando `hora_inicio`/`hora_fin` del bloque de `grupo_horarios` que cubre el día de la semana de esa fecha. Sin cambios de RLS: `turnos_insert`/`turnos_update` (Groundwork 3) ya permiten Admin/Head Coach/Profesor, que es el mismo criterio de "quién carga planificaciones".

**Parche "unificar creación de planificaciones" (2026-08-31):** existían dos formularios de creación que habían divergido — "Nueva clase" (fecha única + profesores, sin selección de fechas múltiples) y el de `/horarios/grupos/[grupoId]/planificar` (día de semana + fechas múltiples, sin profesores). Se eliminó "Nueva clase" (ruta `/horarios/nuevo` y la acción `crearTurno` borradas); la única forma de crear una planificación es entrando por grupo → mes, y ese formulario único ahora también incluye el checklist de profesores (mismo criterio de permisos que antes: Admin/Head Coach eligen, Profesor autoasignado). De paso se sacó el selector manual de bloque horario (el caso Jungla, dos bloques) tanto de la creación como de "Editar clase": el horario ya no se elige a mano en ningún lado, se deriva siempre del día ISO de la fecha vía el helper compartido `resolverHorarioPorDia` (`src/lib/horarios/resolver-horario.ts`). La sincronización de profesores (diff de altas/bajas, para no reenviar notificación a quien ya estaba asignado) también se compartió (`src/lib/horarios/sync-profesores.ts`) entre `editarTurno` y la carga de planificaciones. **Nota de comportamiento:** al recargar una planificación para fechas que ya tienen un turno con profesores asignados, los profesores tildados en ese envío reemplazan a los anteriores (si no se tilda ninguno, quedan sin profesor) — para tocar el contenido de una sola fecha ya creada sin resubmitir profesores, conviene usar "Editar clase" desde el detalle de esa clase puntual en vez de este formulario. Como consecuencia de que `duplicarPlanificacion` ahora también pasa por el sincronizador, duplicar una planificación copia los profesores de la clase de origen (antes quedaba sin profesor asignado).

**Parche "entrada del módulo Planificaciones" (2026-09-01):** sin cambios de esquema ni de RLS, solo navegación. `/horarios` dejó de ser la grilla plana con todas las planificaciones de todos los grupos y pasó a ser el selector de grupo (el contenido de `/horarios/grupos`, ruta eliminada), así que la entrada del módulo es directamente grupo → mes → planificaciones. Los filtros de estado (Todas/Activo/Cancelado) se movieron a `/horarios/grupos/[grupoId]` (`?estado=`, junto al `?mes=` ya existente), donde filtran la lista acotada de ese grupo y ese mes; `FiltroEstadoTurnoTabs` se generalizó con props `basePath`/`params` para conservar el mes al cambiar de pestaña. El detalle de una clase vuelve ahora al mes de su grupo (`grupo_id` + `fecha`), con fallback al selector para las clases viejas sin `grupo_id` mapeado.

**`profesor_id` (columna eliminada, Groundwork 3, 2026-08-31)**: la relación 1:1 con `users` se reemplazó por la tabla `turno_profesores` (M:N) — hay clases con dos profesoras a la vez (Caro/Dai entre semana, Male/Estefi los sábados), confirmado por Lauti. Los datos existentes se migraron antes de dropear la columna. Mismo criterio ya usado para `tareas`/`tarea_asignados`: sin campo redundante en la tabla principal.

### `turno_profesores`

Relación M:N entre `turnos` y `users` (Groundwork 3, 2026-08-31) — reemplaza `turnos.profesor_id`. Mismo patrón que `tarea_asignados`.

| Columna | Tipo | Notas |
|---|---|---|
| `turno_id` | `uuid` | FK a `turnos(id)`, `on delete cascade`, parte de la PK compuesta |
| `profesor_id` | `uuid` | FK a `users(id)`, `on delete cascade`, parte de la PK compuesta |

RLS: lectura abierta a cualquier autenticado (`turno_profesores_select`, mismo criterio que `turnos_select_authenticated`). Insert/delete: Admin y Head Coach pueden asignar/quitar cualquier profesor; un Profesor solo puede autoasignarse/quitarse a sí mismo (`profesor_id = auth.uid()`) — mismo alcance que tenía antes sobre `turnos.profesor_id`. `turnos_insert`/`turnos_update` ya no pueden condicionar por `profesor_id` (columna eliminada): el criterio de "Profesor solo edita lo suyo" pasa a evaluarse con un `exists` contra `turno_profesores`; para el insert de la fila `turnos` en sí no hay restricción adicional por rol (Admin/Head Coach/Profesor pueden crear), la autoasignación real ocurre en el insert siguiente sobre `turno_profesores`.

**Nota de alcance**: un Profesor puede en teoría autoasignarse (`insert` en `turno_profesores` con `profesor_id = auth.uid()`) a una clase ajena sin pasar por el flujo normal de edición, ya que esa policy no valida contra la fila `turnos`. La UI no ofrece ese camino (el checklist de profesores solo se muestra a Admin/Head Coach), y no rompe nada de negocio — asimetría documentada, no un hueco de seguridad crítico (mismo nivel de rigor que la asimetría ya documentada en `borrarTarea`).

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

Extendida el 2026-08-29 (Fase 1.2, Sesión 1) con el trigger `notificar_comentario_turno_nuevo` (security definer, dispara en cada `insert` real sobre `turno_comentarios`, tipo `'comentario_turno_nuevo'`): a diferencia de la Sesión 2 de Tareas (destinatarios = asignados + creador), un turno solo tiene un `profesor_id` (no una relación M:N), así que el único destinatario es el profesor asignado al turno, excluido si es quien comentó; si el turno no tiene profesor asignado, no se genera ninguna notificación. Mensaje: `"{Nombre} comentó en el turno: {grupo}"`. El trigger de push (`notificaciones_push`, Módulo 7 — Sesión 4) no distingue por `tipo`, así que este tipo nuevo ya queda cubierto sin ningún cambio adicional.

Actualizada el 2026-08-31 (Fase 1.2, Sesión 2, `supabase/migrations/20260831130000_turnos_grupo_id_fk.sql`): la función leía la columna `grupo_nivel`, que en esta misma migración se renombró a `grupo_legacy` — se actualizó para armar el nombre del grupo como `coalesce(grupos.nombre, turnos.grupo_legacy)` (el nombre real una vez que el turno está mapeado a un `grupo_id`, con fallback al texto legacy mientras no lo está). Verificado dentro de una transacción con `rollback` contra la base real con ambos escenarios (turno con `grupo_id` mapeado → usa `grupos.nombre`; turno legacy sin mapear → usa `grupo_legacy`), 0 filas de prueba restantes confirmado.

Actualizada de nuevo el 2026-08-31 (Groundwork 3, `supabase/migrations/20260831140000_f2_groundwork3_multiprofesor_notif_asignacion.sql`), junto con el resto de la migración que pasa `turnos.profesor_id` a `turno_profesores` (M:N, ver sección `turno_profesores`):

- **`notificar_comentario_turno_nuevo` deja de asumir un único destinatario**: en vez de leer `turnos.profesor_id` (columna eliminada), notifica a todos los profesores en `turno_profesores` para ese turno, excluyendo al autor del comentario — mismo cambio de cardinalidad 1:1 → M:N que el resto de esta sesión. Mensaje sin cambios de fondo: `"{Nombre} comentó en la clase: {grupo}"`.
- **Trigger nuevo `notificar_turno_asignado`** (security definer, `after insert on turno_profesores`, tipo `'turno_asignado'`): cubre el hueco detectado al probar la UI de Fase 1.2 — hasta esta sesión no le llegaba nada al profesor cuando se le asignaba una clase (el único disparador scopeado en Fase 1.2 fue "comentario nuevo"). No notifica autoasignación (`auth.uid() = profesor_id`). Al ser M:N, dispara por cada fila nueva en `turno_profesores`, igual que `notificar_tarea_asignada` sobre `tarea_asignados`; `horarios/actions.ts` (`editarTurno`) hace diff de altas/bajas al reasignar (mismo patrón que `editarTarea`, Módulo 7 — Sesión 1), así que no reenvía a quien ya estaba asignado. Mensaje: `"Te asignaron la clase: {grupo} (DD/MM)"`. Si la clase tiene varios profesores asignados, cada inserción en `turno_profesores` genera su propia notificación — todos los asignados se enteran. El trigger de push no distingue por `tipo`, así que este tipo nuevo ya queda cubierto sin cambios adicionales.

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

### `grupos`

Catálogo fijo de los 5 grupos/niveles de la escuela (Fase 2, Sesión 1). Reemplaza el texto libre que antes se escribía a mano en `turnos.grupo_nivel` — unificado en Fase 1.2, Sesión 2 (2026-08-31, `turnos.grupo_id`), ver sección `turnos`.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `nombre` | `text` | `not null`, `unique` |
| `cuota_mensual` | `numeric(10,2)` | `not null`, check `> 0`. Guarda solo el valor vigente, sin historial — el historial de lo efectivamente cobrado vive en los pagos de cada familia (F2 MOD 3). |
| `created_at` | `timestamptz` | default `now()` |
| `updated_at` | `timestamptz` | default `now()`, se actualiza solo con trigger |

RLS: lectura para cualquier autenticado (`grupos_select_authenticated`); alta/edición/borrado solo Admin y Head Coach.

Datos semilla (cuotas vigentes desde septiembre 2026, comunicado oficial del club): Nivel inicial ($45.000), Equipo de competencia infantil ($60.000), Equipo de competencia — Jungla ($85.000), Equipo avanzado ($90.000), Recreativo adultas ($50.000).

### `grupo_horarios`

Uno o más bloques horarios por grupo — tabla aparte (no columnas en `grupos`) porque Jungla tiene dos bloques distintos, único caso hoy pero que obliga a la estructura 1 a varios.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `grupo_id` | `uuid` | FK a `grupos(id)`, `on delete cascade` |
| `dias` | `smallint[]` | `not null`, check no vacío (`cardinality(dias) > 0`) y valores dentro de `[1,7]` (convención ISO de `extract(isodow from fecha)`: 1=lunes … 7=domingo) |
| `hora_inicio` | `time` | `not null` |
| `hora_fin` | `time` | `not null`, check `hora_fin > hora_inicio` |
| `created_at` | `timestamptz` | default `now()` |

Índices: `grupo_id` (join con `grupos`), `dias` (GIN, para filtrar por día). RLS igual que `grupos` (lectura abierta, escritura Admin/Head Coach).

**Nota técnica**: el CHECK original de "no vacío" usaba `array_length(dias, 1) > 0`, que en Postgres devuelve `NULL` (no `0`) para un array vacío — un CHECK que evalúa `NULL` se considera satisfecho, así que el constraint no bloqueaba `dias = '{}'`. Detectado con una prueba automatizada dentro de una transacción con `rollback` antes de cerrar la sesión; corregido a `cardinality(dias) > 0`, que sí devuelve `0` para un array vacío. Verificado con los 8 escenarios de constraint (incluido este) más 9 escenarios de RLS simulados con los IDs reales de Admin/Head Coach/Profesor/Empleado — todos dentro de transacciones con `rollback`, 0 filas de prueba restantes confirmado.

### `grupo_objetivos_mes`

"Objetivo del mes" por grupo (F2 MOD 1, 2026-08-31). Luciana escribe objetivos en varios niveles (trimestre, mes, semana/día, clase puntual) y hoy los mete todos aplastados en el mismo texto; este campo separa el nivel "mes" (el que usa constantemente) del resto. El nivel trimestre no se construyó — apareció una sola vez en todo lo relevado, sigue escribiéndose dentro del texto hasta que se justifique.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `grupo_id` | `uuid` | FK a `grupos(id)`, `on delete cascade` |
| `mes` | `date` | `not null`, siempre el día 1 del mes (check `extract(day from mes) = 1`), `unique(grupo_id, mes)` |
| `objetivo` | `text` | `not null`, markdown, mismo render que `turnos.planificacion` |
| `created_at` | `timestamptz` | default `now()` |
| `updated_at` | `timestamptz` | default `now()`, se actualiza solo con trigger |

RLS: lectura abierta a cualquier autenticado, mismo criterio que `grupos`/`turnos`. Escritura: Admin, Head Coach, Profesor y Secretaria (`grupo_objetivos_mes_write`, política única `for all`) — mismo criterio de "quién carga planificaciones" del módulo. `'Secretaria'` todavía no es un valor posible de `users.rol` (ver nota de `alumnas`/`contactos` más arriba); la policy queda escrita contra el rol correcto para que funcione sola cuando ese parche se resuelva, sin otra migración — mientras tanto el chequeo de aplicación (`planificaciones-actions.ts`) tampoco la incluye porque el tipo `Rol` de TypeScript no la contempla todavía.

### `alumnas`

Datos puros de las alumnas de la escuela (~150 registros, a cargar por import aparte). **No son usuarios del sistema**: sin login, sin cuenta de Auth, sin relación con el rol "Patinador/a" de Fase 1 (entidades separadas a propósito, sin FK ni deduplicación entre ambas).

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `apellido` | `text` | `not null` — se busca y ordena por este campo, no por DNI |
| `nombre` | `text` | `not null` |
| `dni` | `text` | nullable, índice único parcial `alumnas_dni_unique_idx` (`where dni is not null`) — ver nota F2 MOD 2 abajo |
| `fecha_inscripcion` | `date` | `not null`, default `current_date` (agregado en F2 MOD 2) |
| `estado` | `text` | `not null`, default `'activa'`, check: `'activa' \| 'baja'` |
| `grupo_id` | `uuid` | FK a `grupos(id)`, nullable, `on delete restrict` — una alumna pertenece a un solo grupo a la vez; se eligió `restrict` (no `set null`/`cascade`) para que borrar un grupo con alumnas asignadas falle explícitamente en vez de dejarlas huérfanas sin nivel; obligatorio a nivel de formulario en el alta/edición manual (F2 MOD 2), pero no en la base |
| `created_at` | `timestamptz` | default `now()` |
| `updated_at` | `timestamptz` | default `now()`, se actualiza solo con trigger |

Descartado a propósito (decisión de producto, no un olvido): fecha de nacimiento (los grupos se organizan por nivel/destreza, no por edad), email, datos médicos/alergias, motivo de baja.

**F2 MOD 2 (2026-09-02) relajó `dni` y `grupo_id`:** Groundwork 1 los había dejado `not null` (`dni` además `unique` total), probado a propósito en esa sesión. F2 MOD 2 necesitaba lo contrario para tolerar el import futuro del listado real de Luciana (~150 filas, incompletas y con DNI posiblemente repetidos): se preguntó al usuario (pregunta de alto impacto) y se aplicó `supabase/migrations/20260902120000_f2_mod2_alumnas_ajustes_esquema.sql` — `dni` nullable con índice único parcial (permite muchas filas con `dni is null` pero sigue bloqueando un `dni` real repetido), `grupo_id` nullable en base (el formulario de alta/edición lo sigue exigiendo). La tabla seguía en 0 filas al aplicar el ALTER, sin riesgo de datos existentes.

Índices: `apellido` (orden/búsqueda), `grupo_id` (filtrar por grupo), `alumnas_dni_unique_idx` (único parcial, ver arriba). RLS: lectura y escritura para Admin, Head Coach y Secretaria — ningún otro rol tiene acceso, ni siquiera lectura (política única `for all`). **`'Secretaria'` todavía no es un valor posible de `users.rol`** — Dai sigue con rol `'Admin'` como parche temporal (ver `PROGRESS.md`); la policy ya quedó escrita contra `'Secretaria'` para que funcione sola en cuanto ese parche se resuelva, sin necesitar otra migración; mientras tanto el acceso real de Dai pasa por la rama `'Admin'`. F2 MOD 2 sumó `'Secretaria'` al tipo TypeScript `Rol` (`src/types/user.ts`) por el mismo motivo, sin tocar el CHECK real de la base.

Tabla vacía al cierre de F2 MOD 2 (datos de prueba creados durante la verificación en el navegador, borrados al terminar). La carga de las ~150 alumnas es una sesión aparte, cuando Luciana entregue el listado — con `dni`/`grupo_id` ya nullable en base, no hace falta otra migración de esquema para ese import.

**UI (F2 MOD 2):** listado en `/alumnas` (buscador + filtro de grupo + tabs de estado, todo client-side sobre las ~150 filas ya traídas del server, sin paginación ni búsqueda server-side), alta/edición en `/alumnas/nueva` y `/alumnas/[id]/editar` (contactos inline como repetidor de filas, único precedente de ese patrón en la app), ficha en `/alumnas/[id]`. Sección "Administración" nueva en la navegación (`AppHeader.tsx`), visible solo para Admin/Head Coach/Secretaria — único ítem por ahora es "Alumnas". Detalle completo en el Log de sesiones de `PROGRESS.md`.

### `contactos`

Relación uno a varios con `alumnas` — cubre familias con uno, dos responsables, o tutores. Reemplaza campos fijos tipo "madre/padre".

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `alumna_id` | `uuid` | FK a `alumnas(id)`, `on delete cascade` |
| `nombre` | `text` | `not null` |
| `telefono` | `text` | `not null` |
| `relacion` | `text` | nullable (F2 MOD 2 relajó el `not null` de Groundwork 1, mismo motivo que `alumnas.dni`/`grupo_id`), texto libre (ej. "Madre", "Padre", "Tutor") |
| `es_pagador_principal` | `boolean` | `not null`, default `false` — sin restricción de unicidad ni validación, solo precarga por default a esa persona al registrar un pago en F2 MOD 3; la secretaria puede elegir otro contacto si ese pago lo hizo alguien más |
| `created_at` | `timestamptz` | default `now()` |
| `updated_at` | `timestamptz` | default `now()`, se actualiza solo con trigger |

Índice: `alumna_id`. RLS igual que `alumnas` (Admin, Head Coach, Secretaria — política única `for all`).

### `pagos`

F2 MOD 3 (2026-09-02). Un pago es un evento de cobro, no un mes cerrado: una alumna puede tener varias filas con el mismo `mes_correspondiente` (ej. mamá paga parte el día 3, papá completa el día 9). "¿Está pagado el mes?" se calcula sumando (`src/lib/pagos/saldo.ts`), no vive en una sola fila.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `alumna_id` | `uuid` | FK a `alumnas(id)`, `not null`, `on delete restrict` — borrar una alumna no debe destruir en silencio su historial de pagos |
| `contacto_id` | `uuid` | FK a `contactos(id)`, nullable, `on delete set null` — quién pagó; el formulario lo precarga con el pagador principal de la alumna, editable, puede quedar sin especificar |
| `mes_correspondiente` | `date` | `not null`, siempre el día 1 del mes (check, mismo criterio que `grupo_objetivos_mes.mes`) |
| `monto_cuota` | `numeric(10,2)` | `not null`, check `> 0` — **snapshot** de `grupos.cuota_mensual` al momento de este pago, no referencia viva (la cuota cambia 1-2 veces al año; sin snapshot, un cambio desordenaría el histórico) |
| `monto_recargo` | `numeric(10,2)` | `not null`, default `0`, check `>= 0` — cargado explícitamente por la Secretaria (checkbox sugerido, editable), no se aplica fijo porque se perdona a veces |
| `monto` | `numeric(10,2)` | `not null`, check `> 0` — lo efectivamente pagado en este evento, suma de `pagos_metodos`; puede ser parcial, sin bloqueo |
| `estado` | `text` | `not null`, default `'pendiente_verificar'`, check: `'pendiente_verificar' \| 'verificado'` |
| `registrado_por` | `uuid` | FK a `users(id)`, `not null`, `on delete restrict` |
| `verificado_por` | `uuid` | FK a `users(id)`, nullable, `on delete set null` |
| `verificado_en` | `timestamptz` | nullable |
| `created_at` | `timestamptz` | default `now()` |

Constraint adicional `pagos_verificacion_consistente`: `verificado_por`/`verificado_en` van juntos con `estado = 'verificado'` (ambos `null` si está `pendiente_verificar`, ambos no-`null` si está `verificado`) — evita estados a medio verificar si alguien corrige la fila a mano en la base.

Índices: `alumna_id`, `mes_correspondiente`, `estado` (filtro de "Pendientes de verificar"). RLS: lectura y escritura para Admin, Head Coach y Secretaria, mismo patrón que `alumnas`/`contactos` (política única `for all`) — la app solo expone alta (`crearPago`) y la transición de verificación (`marcarPagoVerificado`); no hay edición ni borrado de pagos ya verificados desde la UI (fuera de alcance de F2 MOD 3, corrección manual en base si hace falta).

**Sin campo de comprobante** (decisión de producto, no un olvido): la Secretaria sigue mirando la foto que llega por WhatsApp y corroborando a ojo contra el MP de Luciana; el emparejamiento automático es Fase 3 (API de Mercado Pago) y de todos modos iba a necesitar confirmación manual (pagos combinados y recargos hacen que el monto no siempre calce exacto).

### `pagos_metodos`

Desglose de un pago por método — un pago puede combinar efectivo + transferencia, por ejemplo.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `pago_id` | `uuid` | FK a `pagos(id)`, `not null`, `on delete cascade` |
| `metodo` | `text` | `not null`, check: `'efectivo' \| 'transferencia' \| 'debito'` |
| `monto` | `numeric(10,2)` | `not null`, check `> 0` |

La suma de estas filas tiene que dar exacto `pagos.monto` — validado en `crearPago` (`src/app/(dashboard)/pagos/actions.ts`), sin trigger de validación cruzada en base (mismo criterio que el resto de la app). Índice: `pago_id`. RLS igual que `pagos`.

**Reglas de negocio compartidas** (`src/lib/pagos/reglas.ts`, `src/lib/pagos/saldo.ts`): recargo fijo de $10.000, sugerido cuando ya pasó el día 10 del mes correspondiente y la alumna todavía tiene saldo pendiente (checkbox editable, no un campo separado por alumna/mes); "días de atraso" del reporte de Deudoras se cuentan desde el día 15. Las fechas de "hoy" para estas reglas se calculan en huso horario Argentina (`America/Argentina/Buenos_Aires`), no en el huso del servidor, para no correr un día el corte según la hora en que corra Vercel.

**UI (F2 MOD 3):** `/pagos` (menú), `/pagos/nuevo` (alta: buscador de alumna por apellido, mes, contacto que paga, métodos como repetidor de filas, checkbox de recargo, saldo pendiente informativo antes de guardar), `/pagos/pendientes` (verificación, filtrable por mes; "Marcar como verificado" genera el recibo en el momento, no antes), `/pagos/recaudacion` (total del mes verificado + desglose por método) y `/pagos/deudoras` (alumnas activas con saldo pendiente de un mes, con banner de recordatorio los días 8-9). Sección "Administración" de `AppHeader.tsx` suma el ítem "Pagos" junto a "Alumnas".

### `asistencia`

F2 MOD 4 (2026-09-03). Una fila por alumna por fecha de clase. El guardado es **en bloque**: al confirmar una fecha se crea (o se pisa) una fila por *cada* alumna activa del grupo — `presente = true` para las tildadas, `presente = false` para el resto. Nunca quedan alumnas "sin registro" en una fecha ya guardada, y eso es justamente lo que le da datos completos al cálculo de la alerta de inasistencias.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `alumna_id` | `uuid` | FK a `alumnas(id)`, `not null`, `on delete restrict` — mismo criterio que `pagos.alumna_id`: borrar una alumna no debe destruir en silencio su historial |
| `grupo_id` | `uuid` | FK a `grupos(id)`, `not null`, `on delete restrict` — **snapshot** del grupo en el que estaba la alumna ese día, nunca derivado de `alumnas.grupo_id` al leer: si después cambia de grupo, el historial viejo tiene que seguir mostrando el grupo real de esa fecha |
| `fecha` | `date` | `not null` |
| `presente` | `boolean` | `not null` — no hay tercer estado: sin justificación de ausencias (fuera de alcance de F2 MOD 4) |
| `registrado_por` | `uuid` | FK a `users(id)`, `not null`, `on delete restrict` |
| `created_at` | `timestamptz` | default `now()` |

Constraint `asistencia_alumna_fecha_unica`: `unique (alumna_id, fecha)` — una sola fila por alumna por día. Volver a guardar una fecha ya cargada **actualiza** esas filas (upsert por ese par), no duplica: la asistencia es libremente editable en cualquier fecha pasada, sin restricción, porque a diferencia de Pagos acá no hay paso de verificación que proteger.

Constraint `asistencia_sin_sabados`: `extract(isodow from fecha) <> 6`. **Del bloque de sábado de Jungla no se toma asistencia** (decisión de producto ya cerrada). El filtro vive en tres capas: la UI nunca lista un sábado (`src/lib/asistencia/fechas.ts`), la server action lo rechaza si se arma la URL a mano, y este check es la red de seguridad en base. Es un filtro exclusivo de Asistencia: las planificaciones de sábado de Jungla (F2 MOD 1) siguen funcionando igual.

Índices: `(grupo_id, fecha)` (navegación grupo → mes → fecha) y `(alumna_id, fecha)` (recorrido semanal de la alerta). RLS: lectura y escritura para Admin, Head Coach y Secretaria, política única `for all`, mismo patrón que `alumnas`/`contactos` y `pagos`.

**Alerta de inasistencias** (`src/lib/asistencia/alertas.ts`): **3 semanas calendario consecutivas sin ningún `presente`**, no 3 clases sueltas — contar clases daría un umbral distinto según el grupo, porque cada uno tiene su propia frecuencia semanal (2 o 3 días). La semana va de lunes a domingo y se recorre hacia atrás desde la actual, **sin contar la semana en curso** (para no disparar falsas alarmas a mitad de semana); si además la alumna ya tuvo un presente esta semana, queda fuera de la alerta (volvió). Una semana solo "cuenta" si tiene asistencia ya tomada: las semanas sin clase (feriados) o todavía sin cargar se saltean, no suman ni rompen la racha. Es un reporte que se consulta (`/asistencia/alertas`), **sin notificación ni cron** — mismo criterio que "Deudoras" en Pagos.

**UI (F2 MOD 4):** `/asistencia` (menú: alertas + selector de grupo), `/asistencia/grupos/[grupoId]` (navegación por mes, lista las fechas de clase del mes marcando cuáles ya tienen asistencia cargada y cuáles quedan pendientes), `/asistencia/grupos/[grupoId]/[fecha]` (toma de asistencia: alumnas activas del grupo ordenadas por apellido, arranca sin nadie tildado, un solo submit guarda todo el bloque) y `/asistencia/alertas`. Sección "Administración" de `AppHeader.tsx` suma el ítem "Asistencia" junto a "Alumnas" y "Pagos".

### `torneos`

F2 MOD 5 (2026-09-03). Alcance recortado a **solo el registro**: qué alumnas participan en cada torneo y el control de inscripción paga quedan explícitamente fuera de esta sesión (necesitan su propia definición — la participación es opcional y el pago va a la cuenta NX, no a la MP de las cuotas).

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `nombre` | `text` | `not null`, libre |
| `tipo` | `text` | `not null`, default `'torneo'`, check: `'torneo' \| 'exhibicion' \| 'evento'` |
| `lugar` | `text` | opcional — vacío para lo que es en el club |
| `fecha_inicio` | `date` | `not null` |
| `fecha_fin` | `date` | `not null` — para eventos de un solo día, igual a `fecha_inicio` (el form la autocompleta) |
| `notas` | `text` | opcional |
| `created_at` / `updated_at` | `timestamptz` | default `now()`, `updated_at` mantenido por el mismo trigger `set_updated_at()` que `tareas`/`turnos` |

Constraint `torneos_fecha_fin_valida`: `fecha_fin >= fecha_inicio`, validado también en el formulario y en `crearTorneo`/`editarTorneo`.

**El campo `tipo`:** de las 7 cosas que hoy se cargan a mano, 5 son torneos de competencia pero 2 no (la Exhibición de Cierre no tiene otros clubes ni inscripción, y "último entreno" es solo una marca de calendario); sin este campo esas dos seguirían viviendo como parche en Tareas.

**El estado (Próximo / En curso / Pasado) no es una columna** — se calcula en cada lectura comparando `fecha_inicio`/`fecha_fin` contra hoy (`src/lib/torneos/fechas.ts`), para no depender de un cron o de actualizarlo a mano.

Índice: `fecha_inicio` (orden cronológico del listado y filtro por año). RLS: **primera tabla del proyecto con lectura y escritura diferenciadas** — SELECT para Admin, Head Coach y Secretaria (mismo criterio que `alumnas`/`pagos`/`asistencia`), pero INSERT/UPDATE/DELETE solo para Admin y Head Coach (4 policies separadas en vez de la `for all` única que usan Pagos/Asistencia).

**UI (F2 MOD 5):** `/torneos` (listado en tarjetas cronológicas con ícono por tipo — 🏆 torneo, 💫 exhibición, 📆 evento —, próximo evento destacado arriba con los días que faltan, filtro por año con los pasados atenuados en vez de ocultos), `/torneos/nuevo` y `/torneos/[id]/editar` (solo Admin/Head Coach) y `/torneos/[id]` (detalle, visible también para Secretaria pero sin botones de editar/borrar). Borrado físico, con confirmación — un torneo cargado por error no tiene historial que preservar en esta fase. Sección "Administración" de `AppHeader.tsx` suma el ítem "Torneos" junto a "Alumnas", "Pagos" y "Asistencia".

## Índices

Además de los índices implícitos de las PK/FK y de los 2 explícitos ya existentes (`notificaciones(usuario_id, creado_en)`, `push_subscriptions(usuario_id)`), la auditoría Fase B (sesión 2/3) sumó índices sobre las columnas de mayor uso en filtros/joins de la aplicación (`create index concurrently`, aditivo, no cambia comportamiento):

- `tareas.estado`, `tareas.fecha_vencimiento`, `tareas.created_by`
- `turnos.profesor_id` (índice eliminado en cascada junto con la columna, Groundwork 3, ver más abajo), `turnos.fecha`
- `tarea_comentarios.tarea_id`

Fase 1.2 (Sesión 1) sumó, ya en la migración que crea la tabla (no como ajuste posterior de auditoría): `turno_comentarios.turno_id`.

Fase 2 (Sesión 1) sumó, ya en la migración que crea cada tabla: `grupo_horarios.grupo_id`, `grupo_horarios.dias` (GIN), `alumnas.apellido`, `alumnas.grupo_id`, `contactos.alumna_id`.

Groundwork 3 (2026-08-31) sumó, ya en la migración que crea la tabla: `turno_profesores.profesor_id` (la PK compuesta `(turno_id, profesor_id)` ya cubre las búsquedas por `turno_id`).

F2 MOD 2 (2026-09-02) reemplazó el `unique` total de `alumnas.dni` por el índice único parcial `alumnas_dni_unique_idx` (`where dni is not null`), ver sección `alumnas` más arriba.

F2 MOD 3 (2026-09-02) sumó, ya en la migración que crea cada tabla: `pagos.alumna_id`, `pagos.mes_correspondiente`, `pagos.estado`, `pagos_metodos.pago_id`.

F2 MOD 4 (2026-09-03) sumó, ya en la migración que crea la tabla: `asistencia(grupo_id, fecha)` y `asistencia(alumna_id, fecha)` (compuestos: las dos lecturas del módulo filtran siempre por una de esas dos columnas más un rango de fechas).

F2 MOD 5 (2026-09-03) sumó, ya en la migración que crea la tabla: `torneos.fecha_inicio` (orden cronológico del listado y filtro por año).

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
        ├──< turno_profesores >── turnos
        │
        └──< turno_comentarios (autor_id) >── turnos

grupos ──┬──< grupo_horarios
         ├──< alumnas ──┬──< contactos
         │              ├──< pagos (contacto_id, opcional)
         │              └──< asistencia (F2 MOD 4)
         ├──< turnos (grupo_id, desde Fase 1.2 Sesión 2)
         ├──< grupo_objetivos_mes (F2 MOD 1)
         └──< asistencia (grupo_id, snapshot — F2 MOD 4)

pagos ──< pagos_metodos
pagos ──> users (registrado_por, verificado_por)
asistencia ──> users (registrado_por)

torneos  (sin FK — standalone, F2 MOD 5)
```

Nota: `alumnas`/`contactos` (Fase 2) no tienen FK hacia `users`, `tareas` ni `turnos` — `alumnas` no tiene relación con el rol "Patinador/a" de `users` a propósito. `grupos` sí conecta ahora con `turnos` vía `grupo_id` (Fase 1.2, Sesión 2, 2026-08-31), además de con `alumnas`/`grupo_horarios` (Fase 2) y `grupo_objetivos_mes` (F2 MOD 1). `pagos` (F2 MOD 3) es la primera tabla de Fase 2 que conecta con `users` (quién registró/verificó cada pago). `asistencia` (F2 MOD 4) conecta con las tres: `alumnas` (quién), `grupos` (en qué grupo estaba ese día, como snapshot y no como referencia viva) y `users` (quién la registró). `torneos` (F2 MOD 5) es la primera tabla de Fase 2 sin ninguna FK — el alcance de esta sesión es solo el registro del evento, sin alumnas participantes ni quién lo cargó.

## Fuera de alcance de este módulo (Módulo 2, Fase 1)

- No hay lógica de aplicación de negocio (queries de Tareas/Horarios, hooks) — eso es de los Módulos 4 y 5.

## Fuera de alcance de esta sesión (Fase 2, Sesión 1)

- UI de gestión de grupos (editar nombre/horario/cuota desde la app) — los 5 grupos entran por datos semilla, la pantalla de edición va después en Administración.
- UI de alumnas y contactos — es F2 MOD 2.
- Import del listado real de alumnas — sesión aparte, cuando llegue el archivo de Luciana.
- Retoque de `turnos.grupo_nivel` (texto libre) para usar `grupos` por FK — hecho en Fase 1.2, Sesión 2 (2026-08-31), ver sección `turnos` más arriba.
