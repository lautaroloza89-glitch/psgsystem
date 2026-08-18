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
| 4 | Módulo Tareas | 3 | ✅ Terminado |
| 5 | Módulo Horarios/Turnos | 3 | ⬜ Pendiente |
| 6 | Dashboard | 4, 5 | ⬜ Pendiente |
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

**Módulo activo:** #5 — Módulo Horarios/Turnos (⬜ pendiente).
**Próximo paso:** construir las pantallas y queries de Horarios en `src/app/(dashboard)/horarios/` sobre la tabla `turnos` y sus políticas RLS ya definidas en el Módulo 3.

## 8. Log de sesiones

<!-- Cada sesión agrega una línea acá al terminar -->

| Fecha | Módulo trabajado | Resultado |
|---|---|---|
| 2026-08-17 | 1 — Setup base | Next.js + TypeScript + Tailwind v4 configurados, build local OK. Git inicializado, primer commit pusheado a `github.com/lautaroloza89-glitch/PSG---System` (main). Proyecto Supabase creado y keys cargadas en `.env.local`. Deploy vacío funcionando en `https://psgsystem.vercel.app` (200 OK, placeholder visible). Módulo cerrado ✅. |
| 2026-08-17 | 2 — Modelo de datos | Definidas 5 tablas (`users`, `tareas`, `tarea_asignados`, `tarea_comentarios`, `turnos`) según decisiones acordadas: tareas y proyectos unificados en una sola tabla, tareas con varios responsables (many-to-many), comentarios como historial, turnos por fecha puntual (no recurrente) con estado Activo/Cancelado para poder cancelar un día sin borrar el registro. Migración `supabase/migrations/20260817120000_modelo_datos_inicial.sql` aplicada contra el proyecto real (`gbnpebqcobtoegeagmcl`) vía Management API, verificada (5 tablas + RLS habilitada en todas, sin políticas aún — se definen en el Módulo 3). `docs/modelo-datos.md` actualizado con el modelo final. Tipos TypeScript creados en `src/types/` (`User`, `Tarea`, `TareaAsignado`, `TareaComentario`, `Turno`). `tsc --noEmit` sin errores. Módulo cerrado ✅. |
| 2026-08-17 | 3 — Auth + roles | Decisiones de producto acordadas: sin auto-registro público, el Admin da de alta la cuenta desde Supabase Auth (Dashboard) y el login es email+password; un trigger (`handle_new_user`) crea automáticamente la fila en `public.users` leyendo `nombre`/`rol` de los metadatos del usuario (default `rol='Empleado'` si no vienen, mínimo privilegio). Instalado `@supabase/ssr`; creados los clientes de Supabase (`src/lib/supabase/client.ts`, `server.ts`, `middleware.ts`) y el helper `getCurrentUserProfile()`. `middleware.ts` en la raíz protege las rutas de `(dashboard)` (redirect a `/login` sin sesión, redirect a `/dashboard` si ya hay sesión estando en `/login`). Página de login (`src/app/(auth)/login`, email+password, sin registro) y layout protegido de `(dashboard)` con nombre/rol del usuario y botón de cerrar sesión. Políticas RLS completas para las 5 tablas aplicadas en migración `supabase/migrations/20260817140000_auth_roles_rls.sql` (Admin todo; Profesor sus tareas creadas/asignadas y sus turnos; Empleado solo lo asignado, cambia estado + comenta, bloqueado a nivel trigger para el resto de las columnas; `users` y `turnos` de lectura abierta a cualquier autenticado). Se encontró y corrigió una recursión infinita de RLS en las políticas de `tarea_asignados` (se resolvió con la función `security definer` `usuario_asignado_a_tarea`). Probado de punta a punta con 3 cuentas reales (2 Admin, 1 de prueba alternada entre Empleado/Profesor): 21/21 checks OK (login, visibilidad por rol, edición restringida, trigger anti-escalado del Empleado, aislamiento entre Profesores). `tsc --noEmit` y `next build` sin errores. Módulo cerrado ✅. |
| 2026-08-18 | 4 — Módulo Tareas | Decisiones de UI acordadas: responsables se eligen con un checklist de personas (equipo chico, cómodo en mobile); listado con filtro simple por estado (Todas/Pendiente/En progreso/Completada, sin buscador); vista en tarjetas (mejor para PWA en celular). Construido en `src/app/(dashboard)/tareas/`: listado (`page.tsx`, con filtro por `?estado=`), alta (`nueva/page.tsx`), detalle con cambio de estado y comentarios (`[id]/page.tsx`), edición (`[id]/editar/page.tsx`), y server actions en `actions.ts` (`crearTarea`, `editarTarea`, `actualizarEstadoTarea`, `agregarComentario`) que se apoyan en la RLS del Módulo 3 sin duplicarla en el frontend (solo se replica en las páginas el mismo criterio de "puede editar" para mostrar u ocultar el link de edición). Componentes reutilizables en `src/components/tareas/` (`TareaCard`, `EstadoBadge`, `FiltroEstadoTabs`, `AsignadosChecklist`, `TareaForm`, `EstadoSelector`, `ComentariosList`, `ComentarioForm`). Probado de punta a punta con Playwright contra las 3 cuentas reales (2 Admin, 1 de prueba alternada Empleado/Profesor, devuelta a Empleado al cerrar): alta/edición/cambio de estado/comentarios como Admin y Profesor, aislamiento de visibilidad entre Profesores (solo ve lo propio o asignado, 404 en lo ajeno), Empleado sin botón ni ruta de creación/edición (redirige), cambio de estado y comentario permitidos para Empleado, filtro por estado funcionando. Datos de prueba borrados al terminar. `tsc --noEmit` y `next build` sin errores; se observó un warning de hidratación en consola (`caret-color: transparent` en el textarea de comentarios) solo bajo Chromium headless automatizado, no reproducido en la app real ni afecta la funcionalidad — a confirmar en un uso manual normal. Módulo cerrado ✅. |
