# Diseño 5 — Interactividad y microinteracciones

> Sesión de pulido de frontend sobre el plan `docs/plan-diseno-ux.md` (paso 5). No toca server actions, políticas RLS, accesibilidad ni navegación (eso es el paso 6). No modifica el roadmap de `PROGRESS.md`.

## Qué se corrigió

### Componente nuevo
- `src/components/ui/spinner.tsx` — spinner SVG reutilizable (`animate-spin`, usa `currentColor` para heredar el color de texto del botón que lo contiene).

### Cards (hover que "cambiaba de golpe")
- `TareaCard`, `TurnoCard`: el hover de borde ahora transiciona con los tokens `duration-[var(--duration-base)]` + `ease-standard` (antes era instantáneo). Se agregó `hover:shadow-sm` y un `focus-visible:ring` con el token `--color-focus-ring`, ya que son `<Link>` navegables por teclado.
- `StatCard`: no es clickeable, así que no se le agregó hover (habría sugerido una interacción inexistente). Solo se armonizó la transición de sombra con el mismo token de duración, por consistencia visual con las otras cards.

### Botones con loading state
Se agregó el `Spinner` junto al texto de estado, además de `hover`/`active` (oscurecimiento del color) y `disabled:cursor-not-allowed`, en:
- `TareaForm`, `TurnoForm` (botón "Crear/Guardar")
- `ComentarioForm` (botón "Comentar")
- Login (`(auth)/login/page.tsx`, botón "Ingresar")
- `ToggleEstadoTurnoButton` (Cancelar/Reactivar turno)
- `BorrarTurnoButton`

`EstadoSelector` es un `<select>` nativo (no admite ícono adentro): el spinner se muestra junto a su label mientras se actualiza el estado, en vez de dentro del control.

### Inputs, textarea y select de formularios
Se reemplazó el borde plano por `focus:ring-2 focus:ring-focus-ring focus:border-primary-500` con transición, en todos los campos de `TareaForm`, `TurnoForm`, `ComentarioForm`, `EstadoSelector` y el login. Antes solo se veía el outline azul por defecto del navegador.

### Elementos sin ningún estado interactivo (detectados durante la revisión, no estaban en la lista original pero caían dentro del mismo alcance de "botones/formularios")
- CTA "Nueva tarea" / "Nuevo turno" (listados de Tareas/Horarios): no tenían hover ni focus.
- `FiltroEstadoTabs` / `FiltroEstadoTurnoTabs`: pastillas de filtro sin transición ni focus ring.
- `AsignadosChecklist`: filas del checklist y checkbox sin focus ring.
- Links "Editar tarea" / "Editar turno", "← Volver a tareas/horarios", "Ver todas" / "Ver todos" (dashboard), `LogoutButton`: sin transición ni focus ring.

## Convenciones aplicadas
- Duración: `duration-[var(--duration-fast)]` (150ms) para feedback directo de botones/links; `duration-[var(--duration-base)]` (200ms) para el hover de cards (cambio más "espacial").
- Easing: `ease-standard` (clase autogenerada por Tailwind v4 desde `--ease-standard` en `globals.css`).
- Foco: `focus-visible:ring` en elementos clickeables (botones, links, cards) para no mostrar el ring en click de mouse, solo con teclado; `focus:ring` (sin `-visible`) en inputs/textarea/select, donde también se espera feedback visual al hacer click.
- `ring-offset` ajustado según el fondo real detrás de cada elemento (`ring-offset-bg` sobre el fondo de página, `ring-offset-surface` dentro de las tarjetas `bg-surface`).

## Archivos modificados
```
src/components/ui/spinner.tsx                        (nuevo)
src/components/tareas/TareaCard.tsx
src/components/horarios/TurnoCard.tsx
src/components/dashboard/StatCard.tsx
src/components/tareas/TareaForm.tsx
src/components/horarios/TurnoForm.tsx
src/components/tareas/ComentarioForm.tsx
src/components/tareas/EstadoSelector.tsx
src/components/horarios/ToggleEstadoTurnoButton.tsx
src/components/horarios/BorrarTurnoButton.tsx
src/components/ui/logout-button.tsx
src/components/tareas/FiltroEstadoTabs.tsx
src/components/horarios/FiltroEstadoTurnoTabs.tsx
src/components/tareas/AsignadosChecklist.tsx
src/app/(auth)/login/page.tsx
src/app/(dashboard)/tareas/[id]/page.tsx
src/app/(dashboard)/horarios/[id]/page.tsx
src/app/(dashboard)/tareas/page.tsx
src/app/(dashboard)/horarios/page.tsx
src/app/(dashboard)/dashboard/page.tsx
```

## Verificación
- `tsc --noEmit`: sin errores.
- `next build`: no se corrió — había un dev server activo en el puerto 3000 y pisarle el `.next` rompe sus chunks (ver incidente ya documentado en el Log de sesiones de `PROGRESS.md`, módulo 5).
- **Verificación visual en navegador: pendiente.** Este entorno no tiene `chromium-cli` ni un MCP de browser disponible para automatizarla. Queda para revisar a mano contra `localhost:3000`: hover en las cards de `/tareas` y `/horarios`, tab por teclado en `/tareas/nueva` para ver el focus ring, y disparar un submit para ver el spinner.

## Pendiente para el paso 6 (Accesibilidad y UX)
- Botón/link "Volver" faltante en `/tareas/nueva`.
- Auditoría WCAG 2.2 AA completa (skill `a11y-audit`).
