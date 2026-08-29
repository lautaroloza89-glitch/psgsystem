# Auditoría — Fase B, sesión 1/3: Frontend

> Para Claude Code: sesión de corrección de la Fase B de la auditoría (`/auditoria-psg`, 2026-08-28). Trabajar SOLO estos hallazgos, uno a la vez, cada uno con su propio commit — no mezclar con las sesiones 2/3 (base de datos) ni adelantar código de esas sesiones. Al terminar cada hallazgo: `tsc --noEmit`, verificación visual si aplica, commit, y recién ahí seguir con el siguiente.

Orden sugerido (código muerto → nomenclatura → diseño → rendimiento, según el pedido original de auditoría):

## 1. Campo "Capacidad" visible pero no editable (código muerto)

`turnos.capacidad` sigue en el tipo, se sigue leyendo y mostrando en 3 pantallas, pero no está en el formulario y no se puede cargar ni corregir desde la UI. Es una decisión documentada (`docs/modelo-datos.md`: "se mantiene por si se vuelve a usar más adelante"), pero hoy es un dato de solo lectura que confunde.

**Archivos a tocar:**
- `src/components/horarios/TurnoCard.tsx` (líneas ~12, ~40)
- `src/app/(dashboard)/horarios/page.tsx` (líneas ~36, ~53)
- `src/app/(dashboard)/dashboard/page.tsx` (líneas ~58, ~72)
- `src/app/(dashboard)/horarios/[id]/page.tsx` (líneas ~27, ~62)

**Qué hacer:** quitar `capacidad` del `select` de Supabase y del JSX que lo muestra en esas 4 pantallas. NO tocar el tipo `Turno` ni la columna de la base — la decisión de mantenerla "por si se usa después" sigue vigente.

## 2. "Editar turno" vs "Editar Clase/Turno" (nomenclatura)

`src/app/(dashboard)/horarios/[id]/editar/page.tsx` (líneas ~9, ~52) sigue diciendo "Editar turno" en el `metadata.title` y el `<h1>`, inconsistente con "Nueva Clase/Turno" que ya usa el alta.

**Qué hacer:** cambiar esas 2 líneas a "Editar Clase/Turno". Cambio de texto puro.

## 3. 2 lugares sin `UsuarioRolCargo` (nomenclatura)

`ComentariosList.tsx:29` (autor del comentario) y `TurnoCard.tsx:39` (profesor del turno) muestran el nombre a mano en vez de con el componente `UsuarioRolCargo` (rol + cargo), porque sus queries no traen esos campos. El resto de la app sí lo usa (`MiembroCard`, `TareaCard`, `AsignadosChecklist`, detalle de tarea).

**Antes de tocar código:** confirmar con Lauti si tiene sentido mostrar rol+cargo también en un comentario (más formal) o si se prefiere dejarlo así (más informal, solo nombre) — no es solo mecánico.

**Si se confirma:** sumar `rol, cargo` al `select` de autor en `src/app/(dashboard)/tareas/[id]/page.tsx:40` y al `select` de `profesor:users(...)` en `horarios/page.tsx:36` y `dashboard/page.tsx:58`; reemplazar el `<span>` por `<UsuarioRolCargo>` en ambos componentes.

## 4. Grid de StatCards sin fallback mobile (consistencia de diseño)

`src/app/(dashboard)/dashboard/page.tsx:128` — el grid de las 4 `StatCard` de Admin es `grid-cols-2 sm:grid-cols-4`, sin fallback a 1 columna en mobile, a diferencia de todos los demás grids de la app.

**Qué hacer:** cambiar a `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`, igual patrón que `horarios/page.tsx:82`, `miembros/page.tsx:24`, `tareas/page.tsx:87`.

## 5. Sin `loading.tsx` en todo el proyecto (rendimiento)

No existe ningún `loading.tsx`, ni siquiera uno compartido en `(dashboard)/layout.tsx`. Afecta las 10 rutas que hacen fetch a Supabase en Server Components.

**Qué hacer:** un único `loading.tsx` en `src/app/(dashboard)/` (skeleton/spinner genérico) que cubra las 10 rutas de una sola vez, en vez de 10 archivos repetidos. Evaluar aparte, sin bloquear esta sesión, si `dashboard/` (4 queries en paralelo) amerita uno propio más adelante.

---

Informe completo (con el resto de los hallazgos de DB) en el plan de la sesión de auditoría original — pedirle a Lauti el archivo si hace falta contexto adicional.
