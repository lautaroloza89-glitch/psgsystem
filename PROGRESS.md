# 🎯 PROGRESS — Sistema de Gestión · Escuela de Patín

> **Para Claude Code: leé este archivo completo ANTES de escribir código.**
> Este documento es la fuente de verdad del proyecto. Actualizalo al final de cada módulo terminado (secciones 7 y 8). No avances a un módulo nuevo si el anterior no está marcado ✅, salvo pedido explícito del usuario.

---

## 1. Resumen del proyecto

Sistema tipo Asana/ClickUp simplificado, hecho a medida para una escuela de patín (equipo chico, máx. 10 personas). Reemplaza suscripciones pagas por una herramienta propia.

Es una **PWA** (Progressive Web App): un solo código que funciona en el navegador y también se puede "instalar" en el celular como app, sin pasar por App Store / Play Store.

No maneja carga de archivos, fotos ni audios (fuera de alcance por ahora).

## 2. Roles del sistema

Son 3 niveles de **permiso**, no cargos — varios puestos del club pueden compartir el mismo rol.

| Rol | Puede |
|---|---|
| **Admin** (dueño) | Crear/editar/borrar todo. Ver todo. Gestionar usuarios y permisos. |
| **Profesor** | Crear y gestionar sus tareas y sus horarios asignados. |
| **Empleado** | Ve solo lo asignado a él. Puede cambiar el estado de su propia tarea (Pendiente → En progreso → Completada) y dejar un comentario corto. NO edita estructura, fechas ni asignados. |

**Mapeo de puestos del club → rol del sistema** (decidido 2026-08-17):

| Puesto | Rol |
|---|---|
| Coordinadora Principal / Head Coach (dueña) | Admin |
| Secretaria (cuotas, pagos, asistencias) | Admin |
| Preparadora física | Profesor |
| Co-coach / ayudante de la head coach | Profesor |
| Ayudantes (x2) | Empleado |

## 3. Stack propuesto (ajustable antes de arrancar la sesión 1)

- **Frontend:** Next.js (React) + TypeScript + Tailwind CSS
- **PWA:** manifest.json + service worker (instalable en mobile)
- **Backend / DB / Auth:** Supabase (Postgres, plan gratuito)
- **Deploy:** Vercel (plan gratuito, auto-deploy conectado a GitHub)

> Si Lauti prefiere otro stack, definirlo antes de empezar — cambia la estructura de carpetas de abajo.

## 4. Estructura de carpetas

```
escuela-patin-app/
├── PROGRESS.md              ← este archivo
├── docs/
│   ├── modelo-datos.md      ← tablas y campos (a definir)
│   ├── roadmap-general.md   ← mapa general (tareas)
│   └── mapa-horarios.md     ← mapa aparte de horarios/turnos
├── public/
│   ├── manifest.json
│   └── icons/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   ├── tareas/
│   │   │   └── horarios/
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/               ← botones, inputs, cards genéricos
│   │   ├── tareas/
│   │   ├── horarios/
│   │   └── dashboard/
│   ├── lib/
│   │   ├── supabase/         ← cliente y queries
│   │   └── utils/
│   ├── types/                ← Task, User, Turno, etc.
│   └── hooks/
├── supabase/
│   └── migrations/           ← SQL de tablas
├── .env.local
└── package.json
```

## 5. Orden de construcción (un módulo por sesión)

⚠️ No mezclar módulos en la misma sesión. Terminar, probar, commitear, recién ahí seguir. Esto evita saturar el chat y facilita corregir errores de forma aislada.

| # | Módulo | Depende de | Estado |
|---|---|---|---|
| 1 | Setup base (proyecto, config, deploy vacío) | — | ✅ Terminado |
| 2 | Modelo de datos (tablas en Supabase) | 1 | ✅ Terminado |
| 3 | Auth + roles | 2 | ✅ Terminado |
| 4 | Módulo Tareas | 3 | 🟡 En revisión |
| 5 | Módulo Horarios/Turnos | 3 | ✅ Terminado |
| 6 | Dashboard | 4, 5 | ✅ Terminado |
| 7 | Notificaciones | 4, 5 | ⬜ Pendiente |

Estados: ⬜ Pendiente · 🟡 En progreso · ✅ Terminado

## 6. Reglas de trabajo para Claude Code

1. Al empezar una sesión: leer este archivo completo y ubicar el primer módulo no terminado en la tabla del punto 5.
2. Trabajar SOLO ese módulo. No adelantar código de módulos futuros.
3. Al terminar: actualizar el estado en la tabla y agregar una línea en el "Log de sesiones" (punto 8).
4. No modificar módulos ya marcados ✅ salvo pedido explícito del usuario.
5. Si falta una decisión de producto no definida acá (ej. un campo nuevo en una tabla), preguntar antes de asumir.
6. Al cerrar el módulo, sugerir un mensaje de commit corto y claro.
7. **No reestructurar este documento** (agregar/quitar/fusionar módulos, cambiar el sistema de estados, etc.) sin pedido explícito del usuario. Si un módulo cambia de alcance, avisar en el chat en vez de reescribir la tabla del punto 5.

## 7. Estado actual

**Módulo activo:** #7 — Notificaciones (⬜ pendiente).
**Próximo paso:** definir alcance de Notificaciones (canal, disparadores) antes de construir.

## 8. Log de sesiones

<!-- Cada sesión agrega una línea acá al terminar -->

| Fecha | Módulo trabajado | Resultado |
|---|---|---|
| 2026-08-17 | 1 — Setup base | Next.js + TypeScript + Tailwind v4 configurados, build local OK. Git inicializado, primer commit pusheado a `github.com/lautaroloza89-glitch/PSG---System` (main). Proyecto Supabase creado y keys cargadas en `.env.local`. Deploy vacío funcionando en `https://psgsystem.vercel.app` (200 OK, placeholder visible). Módulo cerrado ✅. |
| 2026-08-17 | 2 — Modelo de datos | Definidas 5 tablas (`users`, `tareas`, `tarea_asignados`, `tarea_comentarios`, `turnos`) según decisiones acordadas: tareas y proyectos unificados en una sola tabla, tareas con varios responsables (many-to-many), comentarios como historial, turnos por fecha puntual (no recurrente) con estado Activo/Cancelado para poder cancelar un día sin borrar el registro. Migración `supabase/migrations/20260817120000_modelo_datos_inicial.sql` aplicada contra el proyecto real (`gbnpebqcobtoegeagmcl`) vía Management API, verificada (5 tablas + RLS habilitada en todas, sin políticas aún — se definen en el Módulo 3). `docs/modelo-datos.md` actualizado con el modelo final. Tipos TypeScript creados en `src/types/` (`User`, `Tarea`, `TareaAsignado`, `TareaComentario`, `Turno`). `tsc --noEmit` sin errores. Módulo cerrado ✅. |
| 2026-08-17 | 3 — Auth + roles | Decisiones de producto acordadas: sin auto-registro público, el Admin da de alta la cuenta desde Supabase Auth (Dashboard) y el login es email+password; un trigger (`handle_new_user`) crea automáticamente la fila en `public.users` leyendo `nombre`/`rol` de los metadatos del usuario (default `rol='Empleado'` si no vienen, mínimo privilegio). Instalado `@supabase/ssr`; creados los clientes de Supabase (`src/lib/supabase/client.ts`, `server.ts`, `middleware.ts`) y el helper `getCurrentUserProfile()`. `middleware.ts` en la raíz protege las rutas de `(dashboard)` (redirect a `/login` sin sesión, redirect a `/dashboard` si ya hay sesión estando en `/login`). Página de login (`src/app/(auth)/login`, email+password, sin registro) y layout protegido de `(dashboard)` con nombre/rol del usuario y botón de cerrar sesión. Políticas RLS completas para las 5 tablas aplicadas en migración `supabase/migrations/20260817140000_auth_roles_rls.sql` (Admin todo; Profesor sus tareas creadas/asignadas y sus turnos; Empleado solo lo asignado, cambia estado + comenta, bloqueado a nivel trigger para el resto de las columnas; `users` y `turnos` de lectura abierta a cualquier autenticado). Se encontró y corrigió una recursión infinita de RLS en las políticas de `tarea_asignados` (se resolvió con la función `security definer` `usuario_asignado_a_tarea`). Probado de punta a punta con 3 cuentas reales (2 Admin, 1 de prueba alternada entre Empleado/Profesor): 21/21 checks OK (login, visibilidad por rol, edición restringida, trigger anti-escalado del Empleado, aislamiento entre Profesores). `tsc --noEmit` y `next build` sin errores. Módulo cerrado ✅. |
| 2026-08-18 | 4 — Módulo Tareas | Decisiones de UI acordadas: responsables se eligen con un checklist de personas (equipo chico, cómodo en mobile); listado con filtro simple por estado (Todas/Pendiente/En progreso/Completada, sin buscador); vista en tarjetas (mejor para PWA en celular). Construido en `src/app/(dashboard)/tareas/`: listado (`page.tsx`, con filtro por `?estado=`), alta (`nueva/page.tsx`), detalle con cambio de estado y comentarios (`[id]/page.tsx`), edición (`[id]/editar/page.tsx`), y server actions en `actions.ts` (`crearTarea`, `editarTarea`, `actualizarEstadoTarea`, `agregarComentario`) que se apoyan en la RLS del Módulo 3 sin duplicarla en el frontend (solo se replica en las páginas el mismo criterio de "puede editar" para mostrar u ocultar el link de edición). Componentes reutilizables en `src/components/tareas/` (`TareaCard`, `EstadoBadge`, `FiltroEstadoTabs`, `AsignadosChecklist`, `TareaForm`, `EstadoSelector`, `ComentariosList`, `ComentarioForm`). Probado de punta a punta con Playwright contra las 3 cuentas reales (2 Admin, 1 de prueba alternada Empleado/Profesor, devuelta a Empleado al cerrar): alta/edición/cambio de estado/comentarios como Admin y Profesor, aislamiento de visibilidad entre Profesores (solo ve lo propio o asignado, 404 en lo ajeno), Empleado sin botón ni ruta de creación/edición (redirige), cambio de estado y comentario permitidos para Empleado, filtro por estado funcionando. Datos de prueba borrados al terminar. `tsc --noEmit` y `next build` sin errores; se observó un warning de hidratación en consola (`caret-color: transparent` en el textarea de comentarios) solo bajo Chromium headless automatizado, no reproducido en la app real ni afecta la funcionalidad — a confirmar en un uso manual normal. Módulo cerrado ✅. |
| 2026-08-18 | 5 — Módulo Horarios/Turnos | Decisión de producto acordada: el dropdown de "profesor" en el formulario de turnos debe mostrar tanto a los usuarios con `rol = 'Profesor'` como a los `Admin` que también dictan clases (la Head Coach/dueña sí dicta, la Secretaria no, y ambas comparten el rol de permisos `Admin`). Para eso se agregó a `users` una columna nueva `dicta_clases boolean not null default false` (migración `supabase/migrations/20260818150000_users_dicta_clases.sql`, aplicada contra el proyecto real vía Management API y registrada en `supabase_migrations.schema_migrations`) — no es un rol de permisos nuevo, no toca RLS de turnos. Con el usuario se confirmó que `patinsaintgermain@gmail.com` es la Head Coach/dueña (`dicta_clases = true`); `lautaroloza89@gmail.com` queda en `false` (Secretaria aún no cargada como usuaria). Construido en `src/app/(dashboard)/horarios/`: listado con filtro por estado (`page.tsx`, `?estado=`), alta (`nuevo/page.tsx`), detalle (`[id]/page.tsx`), edición (`[id]/editar/page.tsx`), y server actions en `actions.ts` (`crearTurno`, `editarTurno`, `actualizarEstadoTurno`, `borrarTurno`) siguiendo el mismo patrón que Tareas: se apoyan en la RLS del Módulo 3 (Admin todo; Profesor solo sus turnos, no puede reasignar `profesor_id`; Empleado solo lectura) y replican en las páginas el mismo criterio de "puede editar" para mostrar u ocultar acciones. La cancelación es un toggle Activo/Cancelado (agrega también "reactivar", no solo cancelar, ya que usa la misma acción y el mismo criterio de permisos que editar) en vez de un delete; el borrado real queda aparte y visible solo para Admin, con confirmación. Componentes en `src/components/horarios/` (`TurnoCard`, `EstadoTurnoBadge`, `FiltroEstadoTurnoTabs`, `TurnoForm`, `ToggleEstadoTurnoButton`, `BorrarTurnoButton`). `docs/modelo-datos.md` actualizado con la columna nueva. Probado de punta a punta con Playwright contra las 3 cuentas reales (2 Admin, 1 de prueba alternada Profesor/Empleado, devuelta a Empleado al cerrar): 35/35 checks OK — Admin (15: alta con dropdown de profesor incluyendo a la dueña, edición, cancelar/reactivar, borrado real, filtros), Profesor (13: autoasignación sin dropdown en alta y edición, cancelar/reactivar su turno, sin botón de borrar, bloqueado para editar turno ajeno tanto por UI como por redirect directo a la URL), Empleado (7: ve el horario compartido de solo lectura, sin botón de alta, redirigido si entra directo a `/horarios/nuevo` o a una edición, sin botones de cancelar/borrar). Datos de prueba borrados al terminar. Efecto colateral detectado y corregido en la sesión: un `next build` corrido para verificar el módulo pisó la carpeta `.next` de un dev server que ya estaba corriendo en el puerto 3000 (PID 3752, no iniciado por esta sesión) y lo dejó sirviendo chunks viejos (`ERR_ABORTED` / 404 en assets); no se pudo reiniciar ese proceso por una restricción del entorno de la sesión, así que las pruebas se corrieron contra un dev server nuevo en el puerto 3001 (cerrado al terminar) — **si el puerto 3000 sigue sirviendo assets rotos, reiniciar manualmente `npm run dev`**. `tsc --noEmit` y `next build` sin errores. Módulo cerrado ✅. |
| 2026-08-18 | 6 — Dashboard | Decisiones de producto acordadas con el usuario antes de construir: (1) los turnos del dashboard muestran el horario completo compartido para los 3 roles (no solo los turnos propios del Profesor), ya que la RLS de Turnos ya es de lectura abierta a cualquier autenticado; (2) el Admin ve, además de las listas, una fila de 4 contadores agregados (tareas pendientes, tareas en progreso, turnos de hoy, turnos de los próximos 7 días) — Profesor y Empleado no ven contadores, solo las listas; (3) el criterio de "próximos" es un tope fijo de 5 ítems (no una ventana de días), ordenados por fecha ascendente, para que las tareas vencidas/atrasadas queden siempre arriba. Completado `src/app/(dashboard)/dashboard/page.tsx` (antes placeholder del Módulo 3): dos queries de solo lectura (tareas no completadas ordenadas por `fecha_vencimiento`, turnos activos con `fecha >= hoy` ordenados por fecha/hora, ambas con `.limit(5)`) que se apoyan en la RLS del Módulo 3 sin duplicar lógica de permisos — el alcance por rol lo resuelve la propia RLS (Admin ve todas las tareas, Profesor/Empleado solo las suyas; turnos siempre completos). Reutiliza los componentes ya existentes `TareaCard` y `TurnoCard` de los Módulos 4 y 5 en vez de crear una vista propia. Nuevo componente `src/components/dashboard/StatCard.tsx` para los contadores del Admin (los 4 counts se calculan con 4 queries `count: "exact", head: true` en paralelo, solo cuando `profile.rol === "Admin"`). Probado de punta a punta con Playwright contra las 3 cuentas reales (2 Admin, 1 Empleado — `lautaroloza88@gmail.com` estaba en rol Empleado al momento de la prueba; no se testeó Profesor por separado porque la política RLS de `select` de tareas no distingue entre Profesor y Empleado, así que el mismo chequeo con Empleado ya cubre esa rama de código, y el único branch propio de este módulo, `rol === "Admin"`, sí se probó con las 2 cuentas Admin) con datos de prueba temporales (tareas y turnos con prefijo `TEST-DASH`, creados y borrados vía script con `@supabase/supabase-js`, confirmados en 0 al final): contadores de Admin exactos (1 pendiente, 1 en progreso, 1 turno hoy, 2 turnos en la semana), orden correcto (tarea vencida primero), tarea "Completada" correctamente excluida de la lista, Empleado sin contadores y con sus tareas asignadas + horario compartido completo, links "Ver todas"/"Ver todos" navegando a `/tareas` y `/horarios`. `tsc --noEmit` y `next build` sin errores (build corrido sin dev server activo en el puerto por defecto, evitando el problema de la sesión anterior). Módulo cerrado ✅. |
