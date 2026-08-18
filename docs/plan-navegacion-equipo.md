# 🎨 Design System y corrección global — Escuela de Patín

> **Para Claude Code:** aplicar estos tokens y reglas a TODAS las pantallas existentes y futuras. Esto es una corrección de layout global (el Módulo 4 queda 🟡 en revisión), no un módulo nuevo — no tocar Dashboard con calendario ni Notificaciones todavía.

## Motivo de esta corrección

Las pantallas actuales se construyeron sin definir antes un sistema de diseño, así que se usaron valores por defecto de Tailwind. Resultado: texto secundario con muy bajo contraste, sin navegación entre secciones, sin botón de volver en formularios, y mucho espacio vacío sin uso. Esta corrección fija eso antes de seguir construyendo módulos nuevos sobre la misma base.

## 1. Colores (se mantiene la paleta actual navy/crema, se formaliza)

| Token | Valor | Uso |
|---|---|---|
| `bg-primary` | `#F7F5F0` | Fondo general (el crema actual) |
| `text-primary` | `#1A1A2E` | Títulos, texto principal |
| `text-secondary` | `#5C5C6E` | Fechas, asignado, metadata — nunca más claro que esto |
| `accent` | `#2E2E7A` | Botones primarios, tab seleccionado (el navy actual) |
| `success` | `#1E7A4C` | Estado "Completada" |
| `warning` | `#B8860B` | Estado "Pendiente" |
| `info` | `#2563EB` | Estado "En progreso" |

Regla dura: ningún texto puede bajar de 4.5:1 de contraste contra su fondo (estándar WCAG AA). Hoy "Vence: fecha" y el usuario asignado están por debajo de eso — subirlos a `text-secondary`.

## 2. Escala tipográfica

| Elemento | Tamaño | Peso |
|---|---|---|
| Título de sección (ej. "Tareas") | 28px | Bold |
| Título de tarjeta (nombre de tarea) | 18px | Semibold |
| Labels de formulario | 15px | Medium |
| Texto secundario (fecha, asignado) | 14px | Regular — mínimo permitido |

Nunca bajar de 14px: la app se usa desde el celu, en movimiento.

## 3. Navegación — menú hamburguesa (reemplaza el header actual)

```
☰
 ├── Dashboard
 ├── Tareas
 ├── Horarios
 ├── Miembros del equipo
 ├── ──────────
 └── Cerrar sesión
```

El header queda solo con: ícono ☰ + nombre de la pantalla actual. "Cerrar sesión" sale del header y se mueve adentro del menú, separado abajo del todo.

## 4. Botón "Volver" — obligatorio en toda pantalla secundaria

Cualquier pantalla que no sea una principal del menú (Nueva tarea, Editar tarea, Detalle de tarea, Nuevo turno, Editar turno, Detalle de turno) debe mostrar arriba a la izquierda `← Volver`, siempre visible, sin depender del botón atrás del navegador.

## 5. Aprovechamiento del espacio

- Pocas tareas → mostrar un estado vacío con mensaje ("No hay tareas en progreso"), no espacio en blanco sin explicación.
- Muchas tareas (planificación de varias semanas) → lista compacta y scrolleable, sin tanto padding suelto entre cards.

## 6. Pantalla "Miembros del equipo"

Nueva, no existe todavía. Listado de los usuarios del sistema (nombre, email, rol).

## 7. Alcance

**Aplica a:** layout global (header/menú), todas las pantallas de Tareas y Horarios.
**No aplica todavía a:** Dashboard con calendario, Notificaciones — siguen su propio módulo cuando llegue el momento (ver `PROGRESS.md`).

---

## Instrucciones para correr esto en una sesión aparte

1. Abrí una sesión nueva de Claude Code y nombrala **"Corrección global — Design system"**.
2. Primer mensaje: *"Leé `docs/plan-navegacion-equipo.md` completo — son tus instrucciones, aplicalas tal cual están escritas."*
3. Esta corrección pisa deliberadamente tokens de color y ajustes de contraste hechos hoy en `src/app/globals.css` por otra sesión (Diseño 1-6) — es intencional, no es un error si ves diffs grandes ahí.
4. Al terminar: pedile que actualice el punto 5 de `PROGRESS.md` (Módulo 4 → 🟡 En revisión) y que te sugiera un mensaje de commit.
5. Volvé a esta sesión cuando cierre para que revise el diff y commitee, como con el resto.
