# Diseño 3 — Tipografía y jerarquía

> Sesión correspondiente al paso 3 de `docs/plan-diseno-ux.md`. Cambios de estilo/UX sobre Tareas, Horarios y Dashboard (ya ✅ en `PROGRESS.md`) — no es un módulo nuevo del roadmap, autorizado explícitamente por el paso 3 del plan.

## Problema encontrado

La tipografía usaba casi solo dos tamaños en toda la app: `text-xl` para todos los `<h1>` y `text-sm` para prácticamente todo lo demás (inputs, texto de cuerpo, metadatos, subtítulos). Sin escala real, no había forma de distinguir de un vistazo qué era un título, qué un subtítulo y qué texto normal. Dos casos puntuales:

- Los subtítulos "Responsables" y "Comentarios" (detalle de tarea) usaban `text-sm font-medium` — **más chicos que el texto normal que tenían debajo**, al revés de lo esperado.
- Los títulos de tarjeta (`TareaCard`, `TurnoCard`) y los de sección del dashboard ("Tareas próximas a vencer", etc.) no tenían tamaño explícito: heredaban el `text-base` del body y solo se distinguían por el peso (`font-medium`), con muy poco contraste contra el texto de al lado.
- El contenido principal a leer (descripción de tarea, datos del turno) estaba en `text-sm` (13px), el mismo tamaño que las fechas y notas al pie — incómodo de leer.

## Escala aplicada

Se reutilizaron los tokens de tipografía ya definidos en `src/app/globals.css` (paso 2 del plan, `--text-xs` a `--text-5xl`) — no se agregó ningún tamaño nuevo. Se definieron 5 niveles según el rol de cada texto:

| Nivel | Clase | Tamaño | Dónde se usa |
|---|---|---|---|
| Título de página | `text-2xl font-bold tracking-tight` | 31px | `<h1>` de Dashboard, Tareas, Horarios, altas, ediciones y detalle |
| Marca / wordmark | `text-xl font-bold tracking-tight` | 25px | "Escuela de Patín" en login y home (pantalla de un solo elemento, no compite con nada) |
| Subtítulo de sección | `text-lg font-semibold` | 20px | "Tareas próximas a vencer", "Próximos turnos", "Responsables", "Comentarios" |
| Título de tarjeta | `text-base font-semibold` | 16px | Nombre de tarea/turno dentro de `TareaCard` / `TurnoCard` |
| Contenido a leer | `text-base` | 16px | Descripción de tarea, datos del turno (fecha/horario/profesor/capacidad), lista de responsables, texto del comentario |
| Meta / secundario | `text-sm` (sin cambio) | 13px | Fechas cortas, enlaces "Ver todas", estados vacíos, labels de formulario, badges |

`tracking-tight` es una utilidad estándar de Tailwind (espaciado entre letras), no un token nuevo — se usó solo en los títulos grandes en negrita para que se vean más compactos y con más carácter.

## Archivos modificados

**Títulos de página (`text-xl font-semibold` → `text-2xl font-bold tracking-tight`):**
- `src/app/(dashboard)/dashboard/page.tsx`
- `src/app/(dashboard)/tareas/page.tsx`, `tareas/nueva/page.tsx`, `tareas/[id]/page.tsx`, `tareas/[id]/editar/page.tsx`
- `src/app/(dashboard)/horarios/page.tsx`, `horarios/nuevo/page.tsx`, `horarios/[id]/page.tsx`, `horarios/[id]/editar/page.tsx`

**Marca (`text-xl/2xl font-semibold` → `text-xl font-bold tracking-tight`):**
- `src/app/page.tsx`
- `src/app/(auth)/login/page.tsx`

**Subtítulos de sección (bug de tamaño corregido: eran más chicos que el body):**
- `src/app/(dashboard)/dashboard/page.tsx` — "Tareas próximas a vencer", "Próximos turnos"
- `src/app/(dashboard)/tareas/[id]/page.tsx` — "Responsables", "Comentarios"

**Títulos de tarjeta (sin tamaño explícito → `text-base font-semibold`):**
- `src/components/tareas/TareaCard.tsx`
- `src/components/horarios/TurnoCard.tsx`

**Contenido a leer (`text-sm` → `text-base`):**
- `src/app/(dashboard)/tareas/[id]/page.tsx` — descripción de la tarea, lista de responsables
- `src/app/(dashboard)/horarios/[id]/page.tsx` — datos del turno (fecha/horario/profesor/capacidad)
- `src/components/tareas/ComentariosList.tsx` — texto del comentario (separado de la línea de autor/fecha, que sigue en `text-sm`)

**Número destacado (más peso visual):**
- `src/components/dashboard/StatCard.tsx` — `font-semibold` → `font-bold`

## Lo que quedó afuera, a propósito

- **Inputs de formulario**: siguen en `text-sm` en todos los formularios (login, `TareaForm`, `TurnoForm`, `ComentarioForm`). Es una convención aceptada para campos compactos y cambiarla es una decisión de "pulido general", no de jerarquía tipográfica.
- **Colores de texto**: siguen en `text-black/50`, `/70`, etc. en vez de los tokens semánticos `--color-text`, `--color-text-muted`, `--color-text-subtle` definidos en el paso 2. Migrarlos corresponde al **paso 4 (Pulido visual general)** y al **paso 9 (Consistencia final)** del plan — se dejó fuera para no mezclar alcance en esta sesión.

## Verificación

- `tsc --noEmit`: sin errores.
- `next build`: no se corrió — había un dev server activo en el puerto 3000 (mismo riesgo detectado en el Módulo 5: un build pisa la carpeta `.next` de un dev server corriendo en paralelo).

## Próximo paso

Paso 4 del plan (`docs/plan-diseno-ux.md`) — sesión *"Diseño 4 — Pulido general"*: espaciados, colores (wiring de los tokens semánticos a los componentes) y que la interfaz "respire".
