# 🎯 PROGRESS — Sistema de Gestión · Escuela de Patín

> **Para Claude Code: leé este archivo completo ANTES de escribir código.**
> Este documento es la fuente de verdad del proyecto. Actualizalo al final de cada módulo terminado (secciones 7 y 8). No avances a un módulo nuevo si el anterior no está marcado ✅, salvo pedido explícito del usuario.

---

## 1. Resumen del proyecto

Sistema tipo Asana/ClickUp simplificado, hecho a medida para una escuela de patín (equipo chico, máx. 10 personas). Reemplaza suscripciones pagas por una herramienta propia.

Es una **PWA** (Progressive Web App): un solo código que funciona en el navegador y también se puede "instalar" en el celular como app, sin pasar por App Store / Play Store.

No maneja carga de archivos, fotos ni audios (fuera de alcance por ahora).

## 2. Roles del sistema

| Rol | Puede |
|---|---|
| **Admin** (dueño) | Crear/editar/borrar todo. Ver todo. Gestionar usuarios y permisos. |
| **Profesor** | Crear y gestionar sus tareas/proyectos y sus horarios asignados. |
| **Empleado** | Ve solo lo asignado a él. Puede cambiar el estado de su propia tarea (Pendiente → En progreso → Completada) y dejar un comentario corto. NO edita estructura, fechas ni asignados. |

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
│   ├── roadmap-general.md   ← mapa general (tareas/proyectos)
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
| 1 | Setup base (proyecto, config, deploy vacío) | — | 🟡 En progreso |
| 2 | Modelo de datos (tablas en Supabase) | 1 | ⬜ Pendiente |
| 3 | Auth + roles | 2 | ⬜ Pendiente |
| 4 | Módulo Tareas/Proyectos | 3 | ⬜ Pendiente |
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

**Módulo activo:** #1 — Setup base (🟡 en progreso).
**Próximo paso:** completar el setup (deps instaladas, configs de Next/TypeScript/Tailwind, git inicializado con primer commit, deploy vacío en Vercel).

## 8. Log de sesiones

<!-- Cada sesión agrega una línea acá al terminar -->

| Fecha | Módulo trabajado | Resultado |
|---|---|---|
| — | — | — |
