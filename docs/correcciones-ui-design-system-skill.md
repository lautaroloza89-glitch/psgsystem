# Correcciones al flujo de design tokens — feedback para la skill `ui-design-system`

> Este doc no narra "qué se hizo" (para eso están `diseno-3-tipografia.md`, `diseno-4-pulido-general.md`, `diseno-5-interactividad.md`). Es específicamente la lista de **correcciones al algoritmo/criterios de la skill** `product-team/ui-design-system/SKILL.md`, detectadas generando y aplicando tokens reales en `src/app/globals.css` de este proyecto. Pensado para combinarse con los docs equivalentes de las otras sesiones y terminar en una skill corregida.
>
> Cada punto indica de dónde sale (comentario explícito en el código, doc de sesión, o inferencia mía comparando versiones) para que quien arme la skill pueda verificarlo si hace falta.

## 1. El step 500 del algoritmo HSV no debe ser literal — tiene que anclar el hex exacto que el usuario aprobó

**Fuente:** decisión propia, paso 2 (generación inicial de tokens).

La tabla de `token-generation.md` dice que el step 500 usa `saturation: 70% del base` y `brightness: original` — es decir, ni siquiera el step "base" reproduce el hex de entrada tal cual. Si el usuario ya eligió y aprobó un color específico en una paleta (ej. paso 1 del plan de diseño), aplicar la fórmula literal al step 500 lo corre a un hex distinto sin que nadie lo note.

**Corrección:** el step 500 siempre tiene que ser exactamente el hex de entrada (`saturation/brightness` originales sin escalar). El resto de la escala (50-400 con brightness fijo 95%, 600-900 escalando el brightness original) se deriva a partir de ahí, no al revés.

## 2. Los neutros no deberían generarse desde el hue del color primario si ya hay dos anclas de texto/fondo aprobadas

**Fuente:** decisión propia, paso 2 → corregido por la sesión de "Corrección global" (`docs/plan-navegacion-equipo.md`), que formaliza explícitamente `bg-primary` y `text-primary` como los dos extremos.

Generar el neutro como una escala mono-hue derivada del primario (mismo hue, saturación baja) es lo más simple, pero si la paleta aprobada ya define un color de texto y un color de fondo específicos (que pueden tener temperaturas distintas — texto frío, fondo cálido, por diseño), hay que **interpolar directamente entre esos dos hex aprobados**, no regenerar el neutro desde cero con la fórmula HSV. Interpolación lineal en RGB entre los dos anclas (con una curva no uniforme, más pasos livianos cerca del extremo claro) da una escala de 10 pasos que preserva exactamente los dos valores que el usuario ya vio y aprobó.

## 3. Verificar contraste WCAG antes de fijar los colores semánticos, no después

**Fuente:** decisión propia, paso 2 (cálculos de contraste corridos con la fórmula de luminancia relativa de `token-generation.md`).

Aplicando la fórmula de la skill sin verificar, salieron combinaciones que fallan AA:
- Un acento/apoyo con brightness alto (pensado como "botón secundario") con texto blanco encima: contraste 2.0–2.3 (necesita 4.5).
- Un verde "success" y un rojo "error" generados con la fórmula estándar: 3.45 y 4.25 con texto blanco (por debajo de 4.5, pasan solo para texto grande).

**Corrección:** el workflow de generación de tokens tiene que incluir el chequeo de contraste como parte del proceso, no como un paso de validación posterior opcional. Regla concreta: si un color de fondo con texto blanco encima da menos de 4.5:1, oscurecer el color base (no el texto) hasta pasar el piso, y definir explícitamente un token "texto sobre este fondo" (no asumir blanco por default) para cada color que pueda usarse como fondo de botón/badge.

## 4. Los colores semánticos (success/warning/error/info) no deberían ser alias del accent/support decorativo

**Fuente:** inferencia mía, comparando el `globals.css` del paso 2 (donde `warning` = alias de `accent`, `info` = alias de `support`) contra la versión posterior de la sesión de corrección global (donde `warning`/`info` son hex independientes, sin relación con el color de marca decorativo). No hay un comentario explícito que lo diga, pero es la lectura más consistente del cambio.

Alias-ear "warning = accent de marca" ahorra un color, pero acopla dos cosas que deberían poder cambiar por separado: si mañana se cambia el accent decorativo de la marca, el significado de "pendiente"/"advertencia" en toda la app cambia con él sin que nadie lo pida. **Corrección:** los colores semánticos de estado (success/warning/error/info) tienen que definirse como escalas independientes desde el arranque, aunque terminen siendo visualmente parecidos a algún color de marca.

## 5. En Tailwind v4, `--spacing-{nombre}` no es un namespace aislado — pisa TODAS las utilidades de tamaño con ese nombre

**Fuente:** comentario explícito dejado en `globals.css` por la sesión de corrección global:
> "NO definir acá tokens `--spacing-xs/sm/md/lg/xl/2xl/3xl` — en Tailwind v4 ese namespace alimenta TODAS las utilidades de tamaño con esos nombres (`max-w-sm`, `w-lg`, etc. quedan pisados)."

Yo había agregado esos alias semánticos de espaciado en el paso 2 asumiendo que solo generaban utilidades `p-xs`/`gap-md`/etc. Es un efecto secundario real y no obvio del sistema de theming CSS-first de Tailwind v4: el namespace `--spacing-*` no es exclusivo de padding/margin/gap, lo comparten todas las utilidades dimensionales que usan nombres de tamaño (`max-w-*`, `w-*`, `h-*`, etc.). **Corrección:** si se quieren alias semánticos de espaciado con nombre (`space-comfortable`, etc.) en Tailwind v4, no van bajo `--spacing-*`; hay que usar variables sueltas fuera de `@theme`, o nombres que no choquen con la escala de tamaños existente (`xs/sm/md/lg/xl/2xl/3xl` son justamente los nombres que ya usan `max-w-*` y compañía — el choque es casi garantizado).

## 6. Un "piso duro" de tamaño/contraste de texto tiene que ser una regla explícita del token system, no un tamaño sugerido

**Fuente:** `docs/plan-navegacion-equipo.md`, puntos 1 y 2 — "ningún texto puede bajar de 4.5:1 de contraste", "nunca bajar de 14px: la app se usa desde el celu, en movimiento".

La escala tipográfica del paso 2 (modular 1.25x, `text-xs` = 10px) es matemáticamente prolija pero no tiene piso de uso real: nada impedía que un desarrollador usara `text-xs` para texto que sí hace falta leer cómodo desde un celular en movimiento. Mismo problema con contraste: la escala de neutros del paso 2 tenía pasos intermedios (`neutral-500`, contraste 3.44 sobre el fondo) que son válidos para decoración pero no para texto, y nada en el token system marcaba esa diferencia. **Corrección:** el sistema de tokens tiene que documentar, junto a cada paso de la escala, para qué uso es válido y para cuál no (ej. "neutral-500: solo decorativo/grande, no usar en texto de lectura"), y si el proyecto tiene un piso de producto (ej. "nunca texto legible bajo 14px"), ese piso tiene que quedar como comentario en el token mismo, no solo en un documento de planificación aparte.

## 7. Los inputs con `font-size` menor a 16px disparan zoom automático en iOS Safari

**Fuente:** comentario explícito en `globals.css` (sesión de corrección global):
> "iOS Safari hace zoom automático al enfocar un input con font-size < 16px y no siempre vuelve al nivel original al desenfocar."

Fix aplicado: forzar `font-size: 16px !important` en `input/textarea/select` por debajo de `640px` de viewport, pisando con `!important` las utilidades de Tailwind (`text-sm`, etc.) que traen los formularios. Es un gotcha de plataforma real, no relacionado con el sistema de tokens en sí, pero afecta directamente cualquier decisión de tipografía tomada en el paso 2/3 (una escala que use `text-sm`/13px o menos en inputs de formulario, sin este fix, rompe la UX en iOS). **Corrección:** cualquier skill de tipografía/tokens que incluya tamaños de fuente para inputs de formulario tiene que advertir sobre este piso de 16px en mobile como regla, no como nota al pie.

## 8. Definir tokens semánticos no sirve si los componentes ya existentes no se migran — hace falta un paso de "wiring" con verificación

**Fuente:** `docs/diseno-4-pulido-general.md`, sección "Problema encontrado".

Después del paso 2 (tokens definidos) y el paso 3 (tipografía aplicada), la mayoría de los componentes seguían usando `text-black/50`, `bg-black`, colores sueltos de Tailwind (`amber-`, `red-`, etc.) en vez de los tokens recién creados — los tokens existían en `globals.css` pero no se usaban en ningún lado. **Corrección:** un flujo de design tokens no está completo con solo generar el CSS; necesita un paso explícito de migración componente por componente, y una verificación automatizable al final (ej. `grep` sobre `src/` buscando que no queden colores hardcodeados fuera de los tokens `on-*`) — no alcanza con "los tokens están definidos, ya se pueden usar".

## 9. Focus ring: distinguir `focus-visible` (elementos clickeables) de `focus` (inputs), y variar `ring-offset` según el fondo real

**Fuente:** `docs/diseno-5-interactividad.md`, sección "Convenciones aplicadas".

`focus-visible:ring` en botones/links/cards (para no mostrar el ring en click de mouse, solo navegación por teclado) vs. `focus:ring` simple en inputs/textarea/select (ahí sí se espera feedback visual también al hacer click). Y el `ring-offset` no puede ser un solo valor fijo en el token system: tiene que poder variar según si el elemento está sobre el fondo de página o dentro de una tarjeta con superficie propia (`ring-offset-bg` vs. `ring-offset-surface`), si no el ring queda con un borde del color equivocado alrededor.

## Pendiente de otras sesiones (no cubierto acá)

- Accesibilidad general (WCAG 2.2 AA completo) y navegación — paso 6 del plan, todavía no corrido.
- Responsive/mobile — paso 8, todavía no corrido (más allá del fix puntual de iOS Safari del punto 7).
- No hubo forma de verificar visualmente los cambios en un navegador real en ninguna de las sesiones de pulido (sin Playwright ni MCP de browser disponible) — si la skill corregida termina incluyendo un paso de verificación visual, marcar que hace falta tener esa herramienta disponible de antemano, no asumirla.
