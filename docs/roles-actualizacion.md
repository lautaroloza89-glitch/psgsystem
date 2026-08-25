# Actualización de roles: Head Coach y Patinador

> Extensión al Módulo 3 (Auth + roles), decidida el 2026-08-22. Migración:
> `supabase/migrations/20260822120000_roles_head_coach_patinador.sql`.

## Motivación

El sistema original definía 3 roles de permiso (Admin, Profesor, Empleado).
Se necesitan 2 roles de permiso más para distinguir puestos del club que hoy
no encajan bien en esos 3 niveles, más un campo `cargo` para diferenciar
visualmente a dos personas que comparten un mismo rol (ej. dos Profesores
con especialidades distintas).

No se migró ninguna cuenta real a estos roles nuevos en esta sesión — el
Admin las asigna a mano desde Supabase cuando corresponda.

Fuera de alcance de esta extensión: rol "Secretaria" (se define en otro
momento, cuando se construya el módulo de control administrativo de cuotas
y pagos — es un dominio de datos distinto, alumnos y pagos, al que maneja
hoy el sistema).

## Roles nuevos

| Rol | Permisos |
|---|---|
| **Head Coach** | Mismos permisos que Profesor sobre sus propias tareas y horarios (crear, editar, borrar lo propio). Además, lectura (SELECT) de las tareas y horarios de Profesor, Empleado y Patinador. Sin edición/borrado de lo ajeno, sin gestión de usuarios. |
| **Patinador** | Mismos permisos que Empleado: ve solo lo que tiene asignado, puede cambiar el estado de su tarea y comentar. No edita estructura, fechas ni asignados. |

## Columna nueva: `cargo`

`users.cargo` (`text`, opcional): campo descriptivo libre (ej. "Preparadora
física"). No tiene ningún efecto en RLS ni en la lógica de permisos, solo se
muestra en pantalla junto al rol, en los 3 lugares donde se ve nombre+rol
de un usuario (checklist de responsables al crear/editar tarea, tarjetas de
"Miembros del equipo", detalle y tarjetas de tarea asignada).

## Cambios de RLS (resumen, ver el SQL de la migración para el detalle)

- `tareas_select`, `tarea_asignados_select`, `tarea_comentarios_select`: se
  agregó una rama para Head Coach usando la función helper
  `tarea_visible_para_head_coach(tarea_id)` (creador o algún asignado con
  rol Profesor/Empleado/Patinador).
- `tareas_insert`, `tareas_delete`, `turnos_insert`, `turnos_update`,
  `tarea_asignados_insert`, `tarea_asignados_delete`: Head Coach entra en
  la misma rama que ya tenía Profesor.
- `tareas_update_admin_profesor` → renombrada
  `tareas_update_admin_profesor_headcoach` (mismo criterio + Head Coach).
- `tareas_update_empleado` → renombrada `tareas_update_empleado_patinador`
  (mismo criterio + Patinador), y el trigger `check_tarea_update_empleado`
  ahora también restringe a Patinador a solo cambiar `estado`.
- `turnos_select` ya era de lectura abierta a cualquier autenticado, así
  que Head Coach y Patinador ya tenían lectura total del horario sin
  cambios.

## Gates de permisos a nivel aplicación

Además de RLS, se actualizaron los checks de rol duplicados en Server
Actions y páginas (para mostrar/ocultar botones y redirects) en
`src/app/(dashboard)/tareas/` y `src/app/(dashboard)/horarios/`: Patinador
se sumó donde antes se excluía solo a Empleado, y Head Coach se sumó donde
antes se incluía solo a Profesor para permisos sobre lo propio.

No se modificó el filtro `rol === "Profesor" || dicta_clases` que arma la
lista de "profesores" asignables a un turno ajeno por el Admin — un Head
Coach que dicte clases se habilita ahí con `dicta_clases = true`, igual que
ya se hace hoy con la dueña.

## UI

`AsignadosChecklist`, `MiembroCard` y el detalle/tarjetas de tarea muestran
ahora, para cada usuario: nombre, rol en negrita, y cargo debajo si existe
(componente compartido `src/components/ui/UsuarioRolCargo.tsx`).

## Ampliación 2026-08-25: Head Coach con control total sobre Turnos

Motivo: en la práctica es Luciana (Head Coach) quien arma la mayor parte de
las planificaciones de clases, y necesitaba poder asignar/reasignar un turno
a cualquier profesor, no solo a sí misma. Se decidió explícitamente darle a
Head Coach el mismo alcance que Admin sobre **turnos** (crear y editar
cualquiera, incluyendo `profesor_id`), mientras que sobre **tareas** el
alcance de Head Coach no cambió (sigue igual que Profesor: solo lo propio,
más la lectura ampliada ya existente). El borrado de turnos sigue siendo
exclusivo de Admin — no se pidió para Head Coach.

Migración `supabase/migrations/20260825160000_head_coach_asigna_turnos.sql`:
`turnos_insert` y `turnos_update` pasan de
`Admin or (Profesor|Head Coach and profesor_id = auth.uid())` a
`(Admin|Head Coach) or (Profesor and profesor_id = auth.uid())`.

Cambios de aplicación en `src/app/(dashboard)/horarios/`:
- `TurnoForm.tsx`: el dropdown de "Profesor" (antes solo Admin) se muestra
  también para Head Coach; Profesor sigue viendo el texto de autoasignación.
- `actions.ts`: `crearTurno` ya no fuerza `profesor_id = profile.id` para
  Head Coach (solo para Profesor); `editarTurno` deja tocar `profesor_id`
  también a Head Coach.
- `[id]/page.tsx` y `[id]/editar/page.tsx`: `puedeEditar` pasa a Head Coach
  a la misma rama que Admin (cualquier turno), separada de la rama de
  Profesor (solo el propio).
