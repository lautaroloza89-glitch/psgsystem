# Auditoría — Fase B, sesión 2/3: Base de datos, cambios aditivos de bajo riesgo

> Para Claude Code: sesión de corrección de la Fase B de la auditoría (`/auditoria-psg`, 2026-08-28). Arrancar solo después de que la sesión 1 (frontend) esté commiteada. Cada migración se propone a Lauti ANTES de aplicarla, de a una por vez, versionada en su propio archivo en `supabase/migrations/` — no aplicar nada automáticamente. Todos los cambios de esta sesión son aditivos (no borran ni transforman datos existentes), pero igual requieren aprobación antes de correr contra la base real.

## 1. Línea de log faltante para la migración de `capacidad`

`supabase/migrations/20260819120000_turnos_capacidad_opcional.sql` existe y ya corrió en producción (confirmado contra la base real: `turnos.capacidad` es `nullable = YES`), pero no tiene línea en el "Log de sesiones" de `PROGRESS.md` (el log salta del 18/08 al 22/08).

**Qué hacer:** agregar una línea retroactiva al punto 8 de `PROGRESS.md` confirmando esta migración. No requiere SQL nuevo, no requiere aprobación de Lauti más allá de avisar que se está completando el log.

## 2. Índices faltantes en columnas de alto uso

Solo existen 2 índices explícitos en todo el esquema (`notificaciones(usuario_id, creado_en)`, `push_subscriptions(usuario_id)`) — confirmado contra la base real, sin drift respecto a las migraciones. Columnas usadas activamente para filtrar/unir sin índice:
- `tareas.estado`, `tareas.fecha_vencimiento`, `tareas.created_by`
- `turnos.profesor_id`, `turnos.fecha`
- `tarea_comentarios.tarea_id`

Con ≤10 usuarios el impacto de performance es bajo hoy, pero conviene adelantarlo antes de que crezca el volumen.

**Propuesta a confirmar con Lauti:** migración nueva con `create index concurrently` sobre esas 6 columnas. Es aditivo y no cambia comportamiento — bajo riesgo, pero igual proponer antes de aplicar.

## 3. `notificaciones` sin política de `delete`

Confirmado contra la base real (`pg_policies`): la tabla `notificaciones` solo tiene políticas `SELECT`/`UPDATE`, ninguna de `DELETE`, para ningún rol (ni Admin). A diferencia de `push_subscriptions`, donde la ausencia de `update` sí está documentada como decisión consciente, este hueco no está mencionado en ningún doc.

**Antes de tocar código:** preguntarle a Lauti si es intencional ("las notificaciones no se borran nunca"). Si NO lo es → agregar una policy `delete` (a definir si para Admin, o para que cada usuario borre sus propias notificaciones leídas). Si SÍ lo es → no tocar código, solo documentar la decisión en `docs/modelo-datos.md`, mismo patrón que `push_subscriptions`.

## 4. `dicta_clases` no se sincroniza en altas nuevas

El trigger `handle_new_user` no setea `users.dicta_clases` según el `rol` del alta. Confirmado contra la base real: Keyla (rol `Profesor`) tiene `dicta_clases = false` hoy. **Sin impacto funcional actual** — se verificó el filtro real en `horarios/nuevo/page.tsx:24` y `horarios/[id]/editar/page.tsx`: `usuarios.filter(u => u.rol === "Profesor" || u.dicta_clases)`, y como el `OR` ya cubre `rol === "Profesor"`, Keyla aparece igual en el dropdown de asignación de turnos. Solo importaría si en el futuro se filtra por `dicta_clases` sola.

**Propuesta a confirmar con Lauti (prioridad baja, no urgente):**
1. Modificar `handle_new_user` (definido en `20260817140000_auth_roles_rls.sql`) para que setee `dicta_clases = true` por default cuando el rol de alta sea `'Profesor'`.
2. Corregir el dato de Keyla con un `UPDATE` puntual (`dicta_clases = true`) para que quede consistente ahora.

---

Informe completo (con el resto de los hallazgos de frontend y de DB más delicados) en el plan de la sesión de auditoría original — pedirle a Lauti el archivo si hace falta contexto adicional. Los hallazgos #6 (`grupo_nivel`), #7 (`ON DELETE` de notificaciones al borrar tarea) y #8 (aviso de tarea sin responsables) NO van en esta sesión — están en `docs/auditoria-fase-b-3-db-decisiones.md` porque requieren una decisión de producto antes de escribir SQL.
