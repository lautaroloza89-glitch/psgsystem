# Plan de diseño y UX — pulido visual

> Armado a partir de `Skool_Resources/` (biblioteca de 300 skills + banco de prompts), filtrando solo lo aplicable a esta app ya construida. No es marketing ni landing page — es una pasada de diseño sobre un sistema interno real con datos reales.

## Por qué existe este documento

La app funciona de punta a punta (Módulos 1-6 ✅) pero:
1. Visualmente es muy básica — sin paleta, tipografía ni jerarquía cuidadas.
2. Cero interactividad — sin transiciones, hover/focus states ni microinteracciones.
3. Tiene huecos de UX puntuales — ej. el formulario de cargar tarea no tiene botón para volver atrás.

## Cómo usar esto

- Cada sección = **una sesión nueva de Claude Code**, nombrada como se indica en el título.
- Es trabajo transversal sobre Tareas/Horarios/Dashboard (Módulos 4, 5, 6 — ya ✅), autorizado explícitamente acá por el usuario. **No es un módulo nuevo del roadmap de `PROGRESS.md`** — no hace falta tocar la tabla del punto 5 de ese archivo ni el Log de sesiones por esto (son cambios de estilo/UX, no de alcance funcional). Si en algún momento este trabajo agrega una funcionalidad real (no solo estética), ahí sí avisar antes de tocar `PROGRESS.md`.
- Los ítems marcados **Prompt** son de `banco-de-prompts/` (archivos `.docx`) — el texto ya está copiado abajo, tal cual, para pegar directo en la sesión nueva.
- Los ítems marcados **Skill** son carpetas de `1 BIBLIOTECA 300 SKILLS (1)/` con su `SKILL.md` — no están instaladas como comando `/slash` en este proyecto, así que hay que decirle a la sesión que lea el archivo completo (ruta indicada) antes de aplicar sus criterios.
- Al cerrar cada sesión: mismo criterio que siempre — probar, `tsc`/`build`, volver a esta sesión "guía" para revisar el diff y commitear.

---

## 1. Paleta de color — sesión *"Diseño 1 — Paleta"*

**Prompt** (`banco-de-prompts/02-claude-design/06-paleta-desde-sensacion.docx`):

> No tengo colores definidos todavía. Quiero que la marca transmita [ej. calma y naturaleza / energía y juventud / confianza y seriedad].
> Proponeme 2 o 3 paletas de colores que transmitan eso, cada una con sus códigos hex y explicando qué sensación da cada color.
> Después elijo una y la aplicamos.

Completá el corchete pensando en la escuela de patín (ej. "profesionalismo y orden, con un toque dinámico/deportivo, sin perder calidez").

## 2. Design tokens — sesión *"Diseño 2 — Tokens"*

**Skill:** `1 BIBLIOTECA 300 SKILLS (1)/1 BIBLIOTECA 300 SKILLS/product-team/ui-design-system/SKILL.md`

Instrucción sugerida: *"Leé el SKILL.md completo de esa ruta. A partir de la paleta elegida en el paso 1, generá los design tokens (color, tipografía, espaciado en grid de 8pt, sombras, radios, duración de animaciones) como CSS variables en `src/app/globals.css`. La app usa Tailwind v4 vía `@import 'tailwindcss'` (sin `tailwind.config.js`), así que los tokens tienen que quedar utilizables desde ahí. Solo tokens base en este paso, todavía no toques componentes."*

## 3. Tipografía y jerarquía — sesión *"Diseño 3 — Tipografía"*

**Prompt** (`banco-de-prompts/02-claude-design/05-mejorar-tipografia.docx`):

> Revisá la tipografía y la jerarquía visual de esta web.
> Quiero que se note claramente qué es un título, qué es un subtítulo y qué es texto normal.
> Que los tamaños tengan lógica y que todo se lea cómodo.
> Ajustá lo que haga falta y explicame los cambios.

## 4. Pulido visual general — sesión *"Diseño 4 — Pulido general"*

**Prompt** (`banco-de-prompts/01-claude-code/05-mejorar-diseno-web.docx`):

> Mirá la web que construimos. Quiero mejorar cómo se ve.
> Buscá que se vea más [profesional / moderna / cálida / limpia — elegí].
> Prestá atención a: espaciados, tamaños de letra, colores y que respire.
> Hacé los cambios y después contame qué modificaste y por qué.

## 5. Interactividad y microinteracciones — sesión *"Diseño 5 — Interactividad"*

**Skill:** `1 BIBLIOTECA 300 SKILLS (1)/1 BIBLIOTECA 300 SKILLS/engineering-team/senior-frontend/SKILL.md`

Instrucción sugerida: *"Leé el SKILL.md completo. Aplicá estados hover/focus/active/disabled, transiciones y loading states a los componentes ya existentes (TareaCard, TurnoCard, StatCard, botones, formularios de Tareas/Horarios). No toques server actions ni políticas RLS — es una pasada puramente de frontend/interacción sobre lo que ya funciona."*

## 6. Accesibilidad + huecos de UX — sesión *"Diseño 6 — Accesibilidad y UX"*

**Skill:** `1 BIBLIOTECA 300 SKILLS (1)/1 BIBLIOTECA 300 SKILLS/engineering-team/a11y-audit/SKILL.md`

Instrucción sugerida: *"Leé el SKILL.md completo y corré el flujo Scan → Fix → Verify (WCAG 2.2 AA) sobre toda la app. Además, revisá específicamente la navegación en los formularios de alta/edición de Tareas y Horarios: hoy `/tareas/nueva` no tiene forma de volver atrás sin el botón del navegador — agregá ese tipo de affordance (breadcrumb o link 'Volver') donde falte, siguiendo el estilo ya definido en los pasos anteriores."*

Acá se resuelve el bug puntual que mencionaste (falta botón de volver al cargar una tarea).

## 7. Detalles faltantes puntuales — sesión *"Diseño 7 — Detalles faltantes"* (si queda algo suelto)

**Prompt** (`banco-de-prompts/01-claude-code/07-agregar-seccion.docx`), adaptado a un detalle de UI en vez de una sección nueva:

> Quiero agregar [algo puntual que haya quedado pendiente del paso 6].
> Antes de construirlo:
> 1. Decime dónde te parece que debería ir y por qué.
> 2. Respetá el estilo, colores y tipografías que ya tiene la web.
> Cuando lo agregues, no toques lo que ya estaba funcionando.

## 8. Responsive / mobile — sesión *"Diseño 8 — Mobile"*

**Prompt** (`banco-de-prompts/01-claude-code/06-hacer-responsive-celular.docx`):

> Quiero asegurarme de que la web se vea y funcione bien en el celular.
> Revisá que:
> - Nada se rompa ni se salga de la pantalla.
> - Los botones se puedan tocar bien con el dedo.
> - Los textos se lean sin tener que agrandar.
> - Las imágenes se adapten al ancho del teléfono.
> Arreglá lo que haga falta y decime qué ajustaste.

Especialmente relevante: Profesores/Empleados van a cargar tareas y ver turnos desde el celular.

## 9. Control de calidad final — sesión *"Diseño 9 — Consistencia final"*

**Prompt** (`banco-de-prompts/02-claude-design/07-revisar-fidelidad-marca.docx`), usando los tokens del paso 2 como "identidad":

> Revisá esta web contra la identidad de marca:
> - Colores que deberían usarse: [los hex del paso 1]
> - Tipografías: [las definidas en el paso 3]
> - Tono buscado: [la sensación del paso 1]
> Marcame cualquier lugar donde la web se desvíe de la identidad: un color que no corresponde, una fuente distinta, un texto con tono equivocado.
> Listá lo que haya que corregir.

---

## Descartado (revisado, no aplica)

`apple-hig-expert` (apps nativas iOS/macOS, no una web app), `ux-researcher-designer` (research desde cero, no auditoría de algo ya construido), `epic-design` (scrollytelling de landing premium), `landing-page-generator`/`page-cro`/`form-cro`/todo `marketing-skill/*` (conversión y marketing), `performance-profiler` (desproporcionado para esta app chica), skills de testing e2e (`pw`, `review`), y todo `banco-de-prompts/03-skills` (son para crear skills, no diseño de producto).
