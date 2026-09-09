# UI nueva — dónde estamos y cómo seguir

> Documento de traspaso entre sesiones de Claude Code. **Se actualiza al cerrar cada módulo**: se mueve la fila de la tabla, se suma lo que aparezca en «Lo que queda por resolver» y se borra de ahí lo que se cierre. El relato completo de cada sesión vive en `docs/historial/2026-09.md`; esto es el estado vigente y nada más.

---

## Qué es esto

**PSG System** es la app interna del club Patín Saint Germain: Next.js + TypeScript + Tailwind sobre Supabase (Postgres, Auth, RLS), desplegada en Vercel. Es una PWA para un equipo de ~8 personas.

La app **ya funciona y está en uso**. Las Fases 1 y 2 están cerradas: tareas, clases y planificaciones, alumnas, pagos, asistencia, torneos, notificaciones con push. Lo que está en marcha ahora es un **rediseño completo de la interfaz**, módulo por módulo, sobre esa base que ya anda.

Antes de arrancar el rediseño se hizo una tanda de **correcciones pre-UI** en cinco bloques (agujeros de permisos, el rol Secretaria, unificación del criterio de fecha, campos que faltaban, y el modelo de participación en torneos), pensada justamente como base limpia sobre la que escribir la interfaz nueva. Están todas en `main` y verificadas contra la base real.

### Las dos ramas

| Rama | Qué es |
|---|---|
| `main` | La app que el club usa hoy. Es lo que Vercel despliega en producción. **Intacta.** |
| `nueva-ui` | El rediseño. Sacada de `main` el 2026-09-08. Vercel le genera un **preview deployment** en cada push — es ahí donde Lauti mira los avances (Deployments → el último deploy). |

**Las dos ramas usan la misma base de datos** (`gbnpebqcobtoegeagmcl`). Por eso el esquema se toca solo en `main`.

### Los documentos que mandan

| Archivo | Qué dice |
|---|---|
| `CLAUDE.md` | Cómo se trabaja en el repo y dónde va cada cosa de la documentación. |
| `PROGRESS.md` | Estado de los módulos de la app vieja y reglas de trabajo. |
| `docs/decisiones.md` | Las decisiones de producto **vigentes**: alcances, permisos, criterios. |
| `docs/pendientes.md` | Trabajo abierto que no bloquea. |
| `docs/modelo-datos.md` | Tablas, campos, índices, RLS, triggers. |
| `docs/diseno/0N-*.dc.html` | Los modelos visuales, uno por módulo. **Mandan en diseño.** |
| Este archivo | El estado del rediseño. |

---

## Antes de arrancar una sesión nueva

1. `git checkout nueva-ui && git pull`. Si `main` avanzó (correcciones de esquema o de permisos), mergealo antes de empezar: `git merge main`.
2. Leé `CLAUDE.md` y `PROGRESS.md`.
3. Leé **entero** el modelo del módulo que toca, en `docs/diseno/0N-*.dc.html` — todas sus opciones (`Xa`, `Xb`, `Xc`…), no solo las primeras.
4. Mirá «Lo que queda por resolver» acá abajo.

## Reglas que no se negocian

Las cuatro primeras salen del documento original del rediseño (`02-copia-y-nueva-ui.md`); la quinta es una instrucción explícita de Lauti.

- **Un módulo por sesión, un commit por módulo.** Al terminar, probarlo con al menos dos roles distintos: uno de gestión y uno del personal.
- **No se cambia el esquema desde esta rama.** Si falta un campo, se agrega en `main`, se documenta en `docs/modelo-datos.md` y recién ahí se mergea. Lo mismo vale para cambios de RLS y de permisos.
- **No mezclar correcciones de permisos con cambios de UI en el mismo commit:** si algo se rompe, no se sabe cuál de los dos fue.
- **Ningún `profile!` ni `as User`.** Los helpers de `permisos.ts` son type guards: si el compilador se queja de null después de un gate, es que a ese helper le falta el guard.
- **Cada cruce entre el modelo y los permisos lo decide Lauti, sobre la marcha.** Antes de escribir un botón que el modelo propone, cruzarlo contra el helper de `src/lib/permisos.ts` (o el de dominio). Si no coinciden, **frenar y preguntarle en el momento**: no resolverlo por cuenta propia ni dejarlo anotado para después. Salió de dos episodios opuestos — el módulo 1 le puso «Tomar asistencia» a la profesora, que no puede; y en el módulo 3 se respetó el `.md` sobre quién edita cuando la intención real era la del modelo. Lo mismo para cualquier situación parecida: ante una inconsistencia, se consulta.

---

## Los 8 módulos

Este orden **no es una sugerencia: es el orden de trabajo.** Va de la estructura hacia adentro, de modo que ninguna pantalla se haga dos veces. El texto de cada módulo es el del documento original.

| # | Módulo | Qué cubre | Estado | Commits |
|---|---|---|---|---|
| 1 | **Navegación e Inicio** | La barra de pestañas reemplaza el cajón `☰`, y el inicio pasa a ser distinto por rol («Requiere tu atención» en vez de los cuatro contadores). Es lo que cambia el esqueleto: hacerlo primero evita rehacer pantallas dos veces. Incluye alinear `loading.tsx` con la pantalla real. | ✅ | `a6351f3` · `10c7c33` |
| 2 | **Miembros** | El más chico, sirve de prueba del sistema visual nuevo: agrupado por rol, detalle editable, `dicta_clases` visible, «Invitar». | ✅ salvo «Invitar» | `cd3fab9` |
| 3 | **Tareas** | «Mis tareas», vencidas marcadas, `UsuarioRolCargo` dado vuelta (ese componente se ve en tres módulos: arreglarlo acá los arregla todos). | ✅ | `f454c3c` · `677019c` |
| 4 | **Asistencia** | Entrar directo al grupo de hoy, «Vino / Faltó», estado Parcial, pie fijo. | ⬜ **el que sigue** | — |
| 5 | **Pagos** | Pantalla con números en vez del menú de cuatro tarjetas, recargo explicado, atraso por alumna. | ⬜ | — |
| 6 | **Alumnas** | Ficha con asistencia y deuda, teléfono tocable, baja fuera del formulario, listado denso. | ⬜ | — |
| 7 | **Planificaciones** y **Torneos** | Pestañas Próximos/Pasados, sin duplicar el destacado, señal de notas. | ⬜ | — |
| 8 | **Participación en torneos** (modelos Tg y Th) | Va última porque es la única pantalla que no existe hoy: se construye sobre `torneo_participantes` y sobre las categorías, que dependen de `alumnas.fecha_nacimiento`. | ⬜ | — |

Antes del módulo 1 hubo dos commits de preparación: los helpers de permisos pasados a type guards (`60b4210`) y los modelos de diseño incorporados al repo (`3f81e42`).

### Al arrancar el módulo 4 (Asistencia)

Está desbloqueado, se puede empezar directo. Dos cosas para tener a mano:

- **La profesora no toma asistencia** — decidido por Lauti y escrito en `docs/decisiones.md`. El modelo del módulo 4 dice lo mismo («la Profesora no, y es a propósito»); el que se contradice es el del módulo 1, que le pone un atajo en su clase del día. Vale el 4. La profesora **sí** ve el estado de sus clases, incluido «asistencia tomada»: necesita saber si ya se cargó.
- El modelo tiene cuatro opciones: `Aa` (llegar a la fecha), `Ab` (tomar asistencia), `Ac` (alertas — «casi no la toco») y `Ad` (inventario). **Leerlas todas antes de escribir**: en el módulo 3 se saltó la opción `Rd` y el formulario de alta quedó sin hacer hasta que Lauti lo detectó en el preview.

---

## Lo que ya está construido y conviene reusar

- **`src/lib/navegacion.ts`** — qué pestañas ve cada rol. Si un módulo cambia de nombre o de ruta, se toca acá.
- **`src/lib/permisos.ts`** — archivo único de permisos, todos type guards. `lib/torneos/permisos.ts` se consolidó acá; quedan aparte `lib/asistencia/permisos.ts` (`puedeGestionarAsistencia`) y `puedeCargarPlanificaciones`, dentro de `horarios/planificaciones-actions.ts`.
- **`src/components/ui/Icono.tsx`** — SVG inline. Para sumar un icono, agregá el trazo al mapa; **no** instalar una librería.
- **`src/lib/miembros/equipo.ts`** — `iniciales()`, `nombreDeRol()` (femenino: «Profesora», «Empleada»), `subtituloMiembro()`.
- **`src/lib/tareas/agenda.ts`** — `cuandoVence()` («Venció hace 7 días», «Mañana») y `agruparPorUrgencia()`. Sirve para cualquier listado con fechas.
- **`src/components/ui/UsuarioRolCargo.tsx`** — ya dado vuelta (persona primero, rol de subtítulo). Se usa en Tareas, Horarios y los dos listados de comentarios: **ya está arreglado en los tres**.
- **`src/components/tareas/ChipsResponsables.tsx`** — chips que por debajo son checkboxes ocultos, así el formulario anda sin JavaScript. Patrón reusable para cualquier multi-selección.
- **Patrón visual del listado:** un `<ul>` dentro de `rounded-xl border border-border bg-surface divide-y divide-border`, con encabezado de grupo en `text-sm font-semibold uppercase tracking-wide text-text-subtle`. Es el que usan Inicio, Miembros y Tareas.
- **`src/lib/utils/date.ts`** — `hoyArgentina()` para todo cálculo de «hoy», nunca `new Date()`. Si un componente de cliente necesita la fecha, se calcula en el servidor y se pasa como prop.

---

## Fuera de alcance de este rediseño

- **El rol Patinador/a.** Decisión de Lauti (2026-09-08): por ahora **no va a haber ninguna cuenta de alumna**, así que el rol queda para una fase posterior. En concreto: no se construye el inicio del modelo `Ic` (su clase, su grupo, su cuota) y **no se agrega el vínculo `users` ↔ `alumnas`** que haría falta para eso. Lo que ya existe se conserva y no molesta: el rol sigue en la base, los gates que le cierran Tareas y Miembros siguen en pie, tiene sus dos pestañas de navegación y su inicio muestra el próximo torneo. Cuando se retome esa fase, lo primero es decidir el vínculo en `main`.

## Lo que queda por resolver

Nada de esto bloquea el rediseño. El detalle está en `docs/pendientes.md`.

| Qué | Impacto real | Dónde se arregla |
|---|---|---|
| `alumnas.fecha_nacimiento` está **vacía en las 158** | Ninguno para construir — ver abajo | Carga de datos, la hace Lauti |
| `users_select_authenticated` es `USING true` | Deja el email del personal legible por cualquier autenticado. La app ya no lo muestra, pero la RLS no acompaña | `main`, cambio de RLS |
| Falta `service_role key` en el server | «Invitar» del módulo 2 quedó sin construir | Variables de entorno |
| 10 Personal Access Tokens de Supabase sin revocar | Ninguno funcional, pero son credenciales vivas | Dashboard de Supabase, a mano |

### Sobre `fecha_nacimiento` — no frena el módulo 8

**Se construye el módulo 8 completo sin esperar los datos, y Lauti los carga después.** Decisión suya del 2026-09-08.

La fecha de nacimiento **no se usa para calcular nada**: el modelo decidió explícitamente no modelar categorías federativas, así que la categoría es texto libre que escribe quien arma la lista («C5 9», «FM 11»). La fecha es una **columna más de la planilla** que se manda a la organización del torneo — nombre, DNI, fecha de nacimiento, categoría —, y el propio modelo ya contempla que falte: las alumnas sin el dato aparecen igual en el listado y al exportar se avisa cuántas faltan.

**Al arrancar el módulo 8, recordárselo a Lauti** por si prefiere tenerlas cargadas para probarlo con datos reales. Si durante la construcción aparece algo que sí se rompa sin el dato, frenar y avisarle en el momento — no inventar un valor por defecto ni derivar la categoría de la edad.

---

## Verificación

En cada módulo se corrió `npx tsc --noEmit` y `npx next build`, los dos limpios. El proyecto **no tiene ESLint configurado**, así que no hay linter que correr.

**Ningún módulo se probó en el navegador desde estas sesiones**: no hubo herramienta de browser. Lauti revisa el preview de Vercel de `nueva-ui` — así detectó que faltaba el formulario de alta del módulo 3. El repaso con dos roles que pide el `02-` sigue pendiente. Si en una sesión futura hay browser, o si se crea una cuenta de prueba con rol Secretaria desde el Dashboard, se puede verificar de verdad: incluso sin browser, levantando `next start`, pidiendo el token con la anon key y haciendo `curl` con la cookie de sesión.

Para tocar la base hace falta un **Personal Access Token** de Supabase (`sbp_...`), que Lauti genera en el momento — no queda guardado en el repo ni entre sesiones. El método está en `CLAUDE.md`.

> Ojo con `next build`: **no correrlo con un `next dev` activo**, pisa `.next` y deja el dev server sirviendo chunks rotos.
