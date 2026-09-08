# UI nueva — dónde quedó y cómo seguir

> Documento de traspaso entre sesiones. **Se actualiza al cerrar cada módulo**: mové la fila de la tabla, agregá lo que aparezca en «Lo que hay que resolver» y borrá de ahí lo que se cierre. El relato completo de cada sesión vive en `docs/historial/2026-09.md`; esto es solo el estado vigente.

Rama: **`nueva-ui`**, sacada de `main` el 2026-09-08. Base de datos: la misma de siempre (`gbnpebqcobtoegeagmcl`).

---

## Antes de arrancar una sesión nueva

1. `git checkout nueva-ui && git pull`. Si `main` avanzó (correcciones de esquema o de permisos), mergealo antes de empezar: `git merge main`.
2. Leé `CLAUDE.md` y `PROGRESS.md`, como siempre.
3. Leé el modelo del módulo que toca, en `docs/diseno/0N-*.dc.html`. **Los modelos mandan en diseño; los `.md` mandan en datos, permisos y reglas.**
4. Mirá la sección «Lo que hay que resolver» de este archivo: puede haber algo que bloquee el módulo que sigue.

## Reglas que no se negocian

- **Un módulo por sesión, un commit por módulo.** Al terminar, probarlo con al menos dos roles: uno de gestión y uno del personal.
- **No se cambia el esquema desde esta rama.** Si falta un campo, se agrega en `main`, se documenta en `docs/modelo-datos.md` y recién ahí se mergea. Lo mismo vale para cambios de RLS y de permisos.
- **No mezclar correcciones de permisos con cambios de UI en el mismo commit.**
- **Ninguna acción en pantalla sin verificar el permiso.** Antes de escribir un botón que el modelo propone, cruzarlo contra el helper de `src/lib/permisos.ts` (o el de dominio). Si el permiso no coincide con el modelo, atar el renderizado al helper real y anotar la discrepancia en `docs/pendientes.md` — nunca copiar el modelo a ciegas ni borrar la acción en silencio. *(Esta regla salió de un error real: el módulo 1 le puso «Tomar asistencia» a la profesora, que no puede.)*
- **Ningún `profile!` ni `as User`.** Los helpers de `permisos.ts` son type guards: si el compilador se queja de null después de un gate, es que a ese helper le falta el guard.

## Estado de los módulos

| # | Módulo | Estado | Commit |
|---|---|---|---|
| 0 | Preparación: helpers de permisos como type guards | ✅ | `60b4210` |
| 0 | Modelos de diseño al repo | ✅ | `3f81e42` |
| 1 | Navegación e Inicio | ✅ | `a6351f3` · `10c7c33` |
| 2 | Miembros | ✅ | `cd3fab9` |
| 3 | Tareas | ✅ | `f454c3c` |
| 4 | Asistencia | ⬜ pendiente | — |
| 5 | Pagos | ⬜ pendiente | — |
| 6 | Alumnas | ⬜ pendiente | — |
| 7 | Planificaciones | ⬜ pendiente | — |
| 8 | Torneos + Participación | ⬜ pendiente | — |

## Lo que ya está construido y conviene reusar

- **`src/lib/navegacion.ts`** — qué pestañas ve cada rol. Si un módulo nuevo cambia de nombre o de ruta, se toca acá.
- **`src/components/ui/Icono.tsx`** — SVG inline. Para sumar un icono, agregá el trazo al mapa; **no** instalar una librería.
- **`src/lib/permisos.ts`** — archivo único de permisos, todos type guards. `lib/torneos/permisos.ts` se consolidó acá; quedan aparte `lib/asistencia/permisos.ts` (`puedeGestionarAsistencia`) y `puedeCargarPlanificaciones`, dentro de `horarios/planificaciones-actions.ts`.
- **`src/lib/miembros/equipo.ts`** — `iniciales()`, `nombreDeRol()` (femenino: «Profesora», «Empleada»), `subtituloMiembro()`.
- **`src/lib/tareas/agenda.ts`** — `cuandoVence()` («Venció hace 7 días», «Mañana») y `agruparPorUrgencia()`. Sirve para cualquier listado con fechas.
- **`src/components/ui/UsuarioRolCargo.tsx`** — ya dado vuelta (persona primero, rol de subtítulo). Se usa en Tareas, Horarios y los dos listados de comentarios: **ya está arreglado en los tres**.
- **Patrón visual del listado:** `<ul>` dentro de `rounded-xl border border-border bg-surface divide-y divide-border`, con encabezado de grupo en `text-sm font-semibold uppercase tracking-wide text-text-subtle`. Es el que usan Inicio, Miembros y Tareas.
- **`src/lib/utils/date.ts`** — `hoyArgentina()` para todo cálculo de «hoy», nunca `new Date()`.

## Lo que hay que resolver (fuera de esta rama)

Todo esto está detallado en `docs/pendientes.md`; acá va lo que **condiciona** los módulos que faltan.

| Qué | A quién bloquea | Dónde se arregla |
|---|---|---|
| No hay vínculo `users` ↔ `alumnas` | El inicio del rol Patinador (módulo 1, quedó sin construir) | `main`, cambio de esquema |
| `alumnas.fecha_nacimiento` está **vacía en las 158** | Módulo 8: la planilla del torneo la necesita | Carga de datos |
| ¿Toma asistencia la profesora? | Módulo 4 — el modelo asume que sí, hoy no puede | Decisión + RLS en `main` |
| `users_select_authenticated` es `USING true` | Nada, pero deja el email del personal legible por cualquier autenticado | `main`, cambio de RLS |
| Falta `service_role key` en el server | «Invitar» del módulo 2 | Variables de entorno |
| No existe ninguna cuenta con rol Patinador | Probar los gates de cualquier módulo con ese rol | Dashboard de Supabase |

## Verificación

En cada módulo se corrió `npx tsc --noEmit` y `npx next build`, los dos limpios. El proyecto **no tiene ESLint configurado**, así que no hay linter que correr.

**Ninguno de los tres módulos se probó en el navegador**: las sesiones no tuvieron herramienta de browser. Ese repaso está pendiente y es lo que pide el `02-` al cerrar cada módulo. Si en una sesión futura hay browser, o si se crean cuentas de prueba (una Secretaria y una Patinador desde el Dashboard), se puede verificar de verdad — incluso sin browser, levantando `next start` y pidiendo el token con la anon key para hacer `curl` con la cookie de sesión.

> Ojo con `next build`: **no correrlo con un `next dev` activo**, pisa `.next` y deja el dev server sirviendo chunks rotos.
