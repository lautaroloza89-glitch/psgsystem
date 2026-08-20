# Diseño 4 — Pulido visual general

> Sesión correspondiente al paso 4 de `docs/plan-diseno-ux.md`. Cambios de estilo/UX sobre Tareas, Horarios y Dashboard (ya ✅ en `PROGRESS.md`) — no es un módulo nuevo del roadmap, autorizado explícitamente por el paso 4 del plan.

## Problema encontrado

La paleta de color del paso 1 y los tokens de sombra/espaciado del paso 2 estaban definidos en `src/app/globals.css`, pero casi ningún componente los usaba. En la práctica, toda la app seguía en blanco y negro puro:

- Texto y bordes en `text-black/50`, `text-black/70`, `text-black/40`, `border-black/10`, `border-black/20` en vez de los tokens semánticos `--color-text-muted`, `--color-text-subtle`, `--color-border`, `--color-border-strong`.
- Botones primarios y pestaña de filtro activa en `bg-black`/`text-white` — el índigo deportivo elegido en el paso 1 no se veía en ningún lado.
- Badges de estado (`Pendiente`, `En progreso`, `Completada`, `Activo`, `Cancelado`) y botones de cancelar/reactivar/borrar con colores de Tailwind sueltos (`amber-`, `blue-`, `green-`, `red-`) en vez de la escala semántica `warning/info/success/error` ya corregida para contraste AA en el paso 2.
- El `body` no tenía fondo ni color de texto explícitos (blanco liso del navegador) — el neutro cálido `--color-bg` del paso 1 quedaba invisible.
- Ninguna tarjeta (`TareaCard`, `TurnoCard`, `StatCard`, login) tenía `background` ni sombra propia — solo un borde fino de 1px, sin profundidad.
- El layout no tenía contenedor centrado: el contenido se estiraba de punta a punta en pantallas grandes.
- Las páginas de alta/edición y el detalle de tarea/turno no tenían tarjeta contenedora: el contenido quedaba pegado directamente al fondo de la página, sin marco.

## Cambios aplicados

### 1. Fondo cálido + superficies con profundidad

- `globals.css`: `body` ahora usa `background-color: var(--color-bg)` y `color: var(--color-text)` — antes no tenía ninguno de los dos seteados.
- Tarjetas de listado (`TareaCard`, `TurnoCard`, `StatCard`) pasaron de borde-sin-fondo a `bg-surface border-border shadow-xs`, con más padding (`p-4` → `p-5`).
- El formulario de login pasó a `bg-surface shadow-sm rounded-xl p-8` (antes `border` sin fondo, `p-6`).
- El detalle de tarea y de turno, y los formularios de alta/edición, ahora están envueltos en una tarjeta `bg-surface border-border shadow-xs rounded-xl p-6 sm:p-8` — antes el contenido flotaba directo sobre el fondo de página.
- Los comentarios individuales (`ComentariosList`) pasaron a `bg-surface-muted` (el neutro un escalón más oscuro que blanco) para que se note el anidado dentro de la tarjeta de comentarios, que ya es blanca.
- El checkbox de `AsignadosChecklist` suma `accent-primary-500`, así el tilde queda del color de marca en vez del azul por defecto del navegador.

### 2. Color de marca en vez de negro/blanco

| Elemento | Antes | Después |
|---|---|---|
| Botones primarios (Ingresar, Crear tarea, Nueva tarea, Nuevo turno, Comentar) | `bg-black text-white` | `bg-primary-500 text-on-primary` |
| Pestaña de filtro activa (Tareas/Horarios) | `border-black bg-black text-white` | `border-primary-500 bg-primary-500 text-on-primary` |

### 3. Colores semánticos en vez de paleta de Tailwind suelta

| Estado | Antes | Después |
|---|---|---|
| Pendiente | `bg-amber-100 text-amber-800` | `bg-warning-100 text-warning-800` |
| En progreso | `bg-blue-100 text-blue-800` | `bg-info-100 text-info-800` |
| Completada / Activo | `bg-green-100 text-green-800` | `bg-success-100 text-success-800` |
| Cancelado | `bg-red-100 text-red-800` | `bg-error-100 text-error-800` |
| Botón "Cancelar turno" | `border-red-200 text-red-700 hover:border-red-400` | `border-error-200 text-error-700 hover:border-error-400` |
| Botón "Reactivar turno" | `border-green-200 text-green-700 hover:border-green-400` | `border-success-200 text-success-700 hover:border-success-400` |
| Botón "Borrar turno" | `border-red-300 text-red-700 hover:border-red-500` | `border-error-300 text-error-700 hover:border-error-500` |
| Mensajes de error de formulario | `text-red-600` | `text-error-600` |

### 4. Texto y bordes tokenizados

| Antes | Después |
|---|---|
| `text-black/50` | `text-text-subtle` |
| `text-black/70` | `text-text-muted` |
| `text-black/40` | `text-text-subtle` |
| `border-black/10` | `border-border` |
| `border-black/20` | `border-border-strong` |
| `hover:border-black/30` (cards) | `hover:border-border-strong` |
| `hover:border-black/40` (tabs, botón "Editar") | `hover:border-neutral-400` |
| `hover:bg-black/5` (checklist) | `hover:bg-surface-muted` |

No se agregó ningún hover/focus nuevo: solo se retiñeron con tokens los que ya existían. Los botones que antes no tenían hover (submits) siguen sin tenerlo — eso es paso 5.

### 5. Que respire: contenedor y espaciado

- `(dashboard)/layout.tsx`: header y `main` ahora comparten un contenedor centrado `mx-auto max-w-5xl`, así el contenido no se estira de punta a punta en desktop. El header además pasó a `bg-surface border-border` para distinguirse del fondo cálido de la página.
- Detalle de tarea/turno: contenedor `max-w-lg` → `max-w-2xl`, envuelto en tarjeta(s) en vez de quedar suelto.
- Altas/ediciones: `mx-auto max-w-lg` a nivel página + tarjeta envolviendo el formulario (el `max-w-lg` se movió de `TareaForm`/`TurnoForm` a la página, ya que ahora lo controla la tarjeta).
- Grillas de tarjetas (listados y dashboard): `gap-3` → `gap-4`.
- Contenedores de página: listados `space-y-4` → `space-y-6`; dashboard `space-y-6` → `space-y-8` con secciones internas `space-y-3` → `space-y-4`.
- Inputs de formulario: `py-2` → `py-2.5`, `space-y-1` (label+input) → `space-y-1.5`.
- Pestañas de filtro: `px-3 py-1` → `px-4 py-1.5`.
- Botones CTA de listado ("Nueva tarea"/"Nuevo turno"): `px-4 py-2` → `px-5 py-2.5`.
- `AsignadosChecklist`: padding del contenedor `p-2` → `p-3`, cada fila `px-1 py-1` → `px-2 py-1.5`.

## Archivos modificados

**Base global:**
- `src/app/globals.css` — fondo y color de texto del `body`.

**Layout y auth:**
- `src/app/(dashboard)/layout.tsx`
- `src/components/ui/logout-button.tsx`
- `src/app/(auth)/login/page.tsx`

**Tareas:**
- `src/app/(dashboard)/tareas/page.tsx`, `tareas/nueva/page.tsx`, `tareas/[id]/page.tsx`, `tareas/[id]/editar/page.tsx`
- `src/components/tareas/TareaCard.tsx`, `EstadoBadge.tsx`, `FiltroEstadoTabs.tsx`, `AsignadosChecklist.tsx`, `TareaForm.tsx`, `EstadoSelector.tsx`, `ComentariosList.tsx`, `ComentarioForm.tsx`

**Horarios:**
- `src/app/(dashboard)/horarios/page.tsx`, `horarios/nuevo/page.tsx`, `horarios/[id]/page.tsx`, `horarios/[id]/editar/page.tsx`
- `src/components/horarios/TurnoCard.tsx`, `EstadoTurnoBadge.tsx`, `FiltroEstadoTurnoTabs.tsx`, `TurnoForm.tsx`, `ToggleEstadoTurnoButton.tsx`, `BorrarTurnoButton.tsx`

**Dashboard:**
- `src/app/(dashboard)/dashboard/page.tsx`
- `src/components/dashboard/StatCard.tsx`

**Sin cambios (a propósito):** `src/app/page.tsx` (placeholder mínimo de `/`, sin colores hardcodeados que migrar).

## Lo que quedó afuera, a propósito

- **Transiciones y microinteracciones**: no se agregó ningún `transition-*`, hover o focus nuevo — solo se retiñeron los estados que ya existían. Corresponde al **paso 5 (Interactividad)**.
- **Botón de "volver" en `/tareas/nueva`**: el hueco de UX ya identificado en el plan sigue sin resolver — corresponde al **paso 6 (Accesibilidad y UX)**.
- **Accesibilidad** (focus rings visibles, contraste fino, navegación por teclado): también paso 6.
- **Home page (`/`)**: se dejó igual, no tenía ningún color hardcodeado que migrar.

## Verificación

- `tsc --noEmit`: sin errores.
- `next build`: no se corrió — había un `next dev` activo en el puerto 3000 (mismo riesgo detectado en el Módulo 5 y en el paso 3: un build pisa la carpeta `.next` de un dev server corriendo en paralelo).
- `grep` sobre `src/` confirmó que no quedó ningún color suelto (`black/`, `bg-black`, `text-white`, `amber-`, `red-`, `green-`, `blue-` fuera de los tokens `on-*`).
- **No se pudo verificar visualmente en un navegador real**: no había herramienta de captura de pantalla disponible en esta sesión (Playwright no está instalado con sus navegadores en el proyecto; los procesos de `chrome-devtools-mcp` detectados corrían en otra sesión y no estaban expuestos acá). Instalar Playwright con descarga de browsers solo para esta verificación se descartó por desproporcionado. **Queda pendiente que el usuario abra `localhost:3000` y revise el resultado a simple vista** (el dev server activo debería reflejar los cambios solo con Fast Refresh).

## Próximo paso

Paso 5 del plan (`docs/plan-diseno-ux.md`) — sesión *"Diseño 5 — Interactividad"*: estados hover/focus/active/disabled, transiciones y loading states sobre los componentes ya existentes.
