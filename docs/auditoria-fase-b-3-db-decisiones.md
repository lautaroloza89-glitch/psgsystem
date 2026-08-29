# Auditoría — Fase B, sesión 3/3: Base de datos, decisiones de producto pendientes

> Para Claude Code: sesión de corrección de la Fase B de la auditoría (`/auditoria-psg`, 2026-08-28). Es la más delicada de las 3 — arrancar solo después de que las sesiones 1 (frontend) y 2 (DB aditivo) estén commiteadas. NO escribir ni una línea de SQL antes de tener la respuesta de Lauti a las preguntas de cada punto. Cada migración se propone versionada en su propio archivo en `supabase/migrations/` y se aplica de a una — nunca todas juntas.

## 1. `turnos.grupo_nivel` como texto libre sin catálogo

Sin tabla de referencia, nada evita variantes tipográficas del mismo nivel ("Nivel 2" vs "nivel 2"). Confirmado contra la base real: hoy existen solo 4 valores, todos distintos entre sí, sin duplicados ("Fin de desarrollo", "Grupo Jungla", "Grupo inicial", "Grupo avanzado", 1 turno cada uno). El riesgo de fragmentación es **teórico todavía**, no manifestado.

**Preguntarle a Lauti:** con solo 4 valores hoy, ¿vale la pena crear una tabla `grupos_nivel` y migrar, o alcanza con acordar una convención de escritura (ej. mayúscula inicial siempre) y dejarlo como texto libre? Dado el volumen actual, probablemente no justifique la complejidad de una tabla nueva — pero es una decisión de Lauti, no algo para asumir.

**Si se decide normalizar:** crear tabla `grupos_nivel (id, nombre unique)` con los 4 valores actuales, agregar `turnos.grupo_nivel_id` como FK, migrar los datos existentes, y recién después de confirmar 0 filas sin matchear, dropear la columna vieja de texto.

## 2. `ON DELETE cascade` de tarea → notificaciones de terceros

Al borrar una tarea, `notificaciones.tarea_id` hace `cascade` — se pierden avisos históricos (leídos o no) de otros usuarios como efecto colateral del borrado, sin relación directa con quien borra la tarea.

**Preguntarle a Lauti:** ¿el comportamiento deseado es que al borrar una tarea "se limpie su rastro" en las notificaciones de todos (estado actual), o que las notificaciones sobrevivan sin el link a la tarea borrada?

**Si se decide que sobrevivan:** cambiar `notificaciones.tarea_id` a `on delete set null`, mismo patrón que ya usan `tareas.created_by` y `turnos.profesor_id`.

## 3. `ON DELETE cascade` de usuario → asignados, tarea puede quedar sin responsables

Al borrar un usuario, `tarea_asignados` hace `cascade` sobre sus asignaciones. Una tarea puede quedar con 0 responsables sin ningún aviso — no hay constraint que exija al menos 1 asignado.

**Preguntarle a Lauti:** ¿qué debería pasar en ese caso? Opciones a plantear: (a) no hacer nada especial, es un caso raro con equipo chico; (b) sumar una validación/log que avise cuando una tarea queda sin responsables tras un borrado; (c) impedir borrar un usuario si tiene tareas donde es el único asignado. No cambiar el `on delete` en sí (borrar la asignación de alguien que ya no existe es correcto) — el punto es qué hacer con la tarea huérfana resultante.

---

Informe completo (con el resto de los hallazgos de frontend y de DB de bajo riesgo) en el plan de la sesión de auditoría original — pedirle a Lauti el archivo si hace falta contexto adicional. Los hallazgos #1-5, #9-12 (frontend, log, índices, RLS de notificaciones, `dicta_clases`) NO van en esta sesión — ya están resueltos en `docs/auditoria-fase-b-1-frontend.md` y `docs/auditoria-fase-b-2-db-aditivo.md`.
