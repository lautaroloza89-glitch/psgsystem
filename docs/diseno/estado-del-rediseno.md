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
| `docs/diseno/lo-que-falta.md` | La hoja de ruta de lo que queda (módulos 7 y 8 + pendientes). Temporal: se borra al terminar el rediseño. |

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
| 4 | **Asistencia** | Entrar directo al grupo de hoy, «Vino / Faltó», estado Parcial, pie fijo. | ✅ | `27161b3` |
| 5 | **Pagos** | Pantalla con números en vez del menú de cuatro tarjetas, recargo explicado, atraso por alumna. | ✅ | `d50b8fa` (main) · `40d4a74` · `7cbd721` |
| 6 | **Alumnas** | Ficha con asistencia y deuda, teléfono tocable, baja fuera del formulario, listado denso. | ✅ | `40984cf` · `9e0f80c` |
| 7 | **Planificaciones** y **Torneos** | Pestañas Próximos/Pasados, sin duplicar el destacado, señal de notas. | ✅ | `935d71f` · `e263812` · `3712573` · `84ffc12` |
| 8 | **Participación en torneos** (modelos Tg y Th) | Va última porque es la única pantalla que no existe hoy: se construye sobre `torneo_participantes` y sobre las categorías, que dependen de `alumnas.fecha_nacimiento`. | ⬜ **el que sigue** | — |

Antes del módulo 1 hubo dos commits de preparación: los helpers de permisos pasados a type guards (`60b4210`) y los modelos de diseño incorporados al repo (`3f81e42`).

### Al arrancar el módulo 8 (Participación en torneos)

Está desbloqueado y es el último. El modelo son las opciones **`Tg` y `Th`** de `docs/diseno/08-torneos.dc.html` (la sección `T2`, arriba del todo del archivo): leerlas enteras antes de escribir nada.

Es la única pantalla del rediseño que **no existe hoy**. Se construye sobre `torneo_participantes` (modelo ya aplicado en el Bloque 5 de las Correcciones pre-UI, sin pantallas) y sobre `torneos.inscripcion_monto`.

Tres cosas para tener a mano:

- **Los permisos ya están escritos** en `src/lib/permisos.ts`: `puedeGestionarConvocatoria` (Admin, Head Coach, Secretaria: convocar, sacar, categoría, estado de inscripción) y `puedeVerConvocatoria` (los tres anteriores más Profesor). Pero `Th` los parte más fino que los dos helpers: **convocar y escribir la categoría es solo Admin/Head Coach** —es una decisión deportiva—, mientras que cambiar el estado de inscripción y registrar el pago suma Secretaria. Y la Profesora ve nombres, **no el monto ni el estado de pago**. Cruzarlo con Lauti antes de escribir los botones.
- **Empleado/a y Patinador/a no ven nada de esto**: ni la lista, ni el bloque del detalle, ni las cifras. Y no solo el botón — el gate va en el servidor. Ojo que hoy la RLS de `torneo_participantes` no lo acompaña (ver `docs/pendientes.md`).
- **`alumnas.fecha_nacimiento` sigue vacía en las 158.** No frena nada: es una columna de la planilla, no un criterio de cálculo, y la categoría es texto libre. **Recordáselo a Lauti al arrancar** por si prefiere cargarlas antes para probarlo con datos reales. Si aparece algo que sí se rompa sin el dato, frenar y avisar — no inventar un valor por defecto ni derivar la categoría de la edad.

Lo que se decidió en el módulo 7 sobre cómo se ve un torneo manda acá: el chip de tipo sin emoji, el destacado que no se repite en la lista, y el ícono de nota como señal de contenido largo.

### Lo que dejó el módulo 7

- **`clasesPlanificadasDelDia` y `gruposDelMes`** (`src/lib/horarios/dia.ts`) derivan las clases de `grupo_horarios` y no de `turnos`, así que una fecha sin planificación cargada **aparece igual**. Acá el sábado cuenta (Iniciación entrena los sábados), a diferencia de `lib/asistencia/dia.ts`.
- **`agruparPorMes` y `repartirTorneos`** (`src/lib/torneos/agrupar.ts`) — el mes como encabezado y las dos pestañas. Sirven para cualquier listado de eventos con fecha.
- **`ChipTipoTorneo`** y **`TorneoFila`** son las piezas de la lista de eventos; `TorneoCard` se borró.
- **`ChipObjetivoMes`** — un `<details>` estilizado como chip, que abre un panel sin JavaScript. Patrón para cualquier contenido largo que no tiene que ocupar lugar hasta que se lo pide.
- **`TiraDeDias`** ahora toma `basePath` y `sabadoInactivo`: la comparten Asistencia y Planificaciones.

---

## Lo que ya está construido y conviene reusar

- **`src/lib/navegacion.ts`** — qué pestañas ve cada rol. Si un módulo cambia de nombre o de ruta, se toca acá.
- **`src/lib/permisos.ts`** — archivo único de permisos, todos type guards. `lib/torneos/permisos.ts` se consolidó acá, y en el módulo 7 también `puedeCargarPlanificaciones` y `puedeEditarClase`. El único que queda aparte es `lib/asistencia/permisos.ts` (`puedeGestionarAsistencia`).
- **`src/components/ui/Icono.tsx`** — SVG inline. Para sumar un icono, agregá el trazo al mapa; **no** instalar una librería.
- **`src/lib/miembros/equipo.ts`** — `iniciales()`, `nombreDeRol()` (femenino: «Profesora», «Empleada»), `subtituloMiembro()`.
- **`src/lib/tareas/agenda.ts`** — `cuandoVence()` («Venció hace 7 días», «Mañana») y `agruparPorUrgencia()`. Sirve para cualquier listado con fechas.
- **`src/components/ui/UsuarioRolCargo.tsx`** — ya dado vuelta (persona primero, rol de subtítulo). Se usa en Tareas, Horarios y los dos listados de comentarios: **ya está arreglado en los tres**.
- **`src/components/tareas/ChipsResponsables.tsx`** — chips que por debajo son checkboxes ocultos, así el formulario anda sin JavaScript. Patrón reusable para cualquier multi-selección.
- **Patrón visual del listado:** un `<ul>` dentro de `rounded-xl border border-border bg-surface divide-y divide-border`, con encabezado de grupo en `text-sm font-semibold uppercase tracking-wide text-text-subtle`. Es el que usan Inicio, Miembros y Tareas.
- **`src/lib/alumnas/ficha.ts`** — `datosDeFichaAlumna()` (asistencia del mes + racha + saldo de una alumna, en una lectura), `rachasParaListado()` (las semanas sin venir de todo el club, para marcar la excepción en un listado) y `edadDe()`.
- **`src/components/pagos/NavegadorDeMes.tsx`** — el control de mes del módulo Pagos, con `basePath` y `extra` para conservar otros query params. Cualquier pantalla que se recorra por mes debería usar este, no escribir sus propias flechas.
- **`src/lib/utils/whatsapp.ts`** — `enlaceWhatsapp()` / `numeroWhatsapp()`, que devuelven `null` cuando el teléfono cargado a mano no se puede interpretar, y `primerNombre()` para los botones («Escribir a Ana»).
- **`src/lib/pagos/mes.ts`** — `calcularEstadoDelMes()`: recaudación, pendientes, deudoras y «X de Y al día» de un mes, en una sola lectura.
- **`src/lib/asistencia/dia.ts`** — `clasesDelDia()` (qué grupos tienen clase una fecha y cómo viene cargada cada una, derivado de `grupo_horarios` y no de `turnos`), `fechasAtrasadas()` y `diasDeLaSemana()`. El inicio ya lo usa, así que las dos pantallas cuentan igual.
- **`src/components/asistencia/TiraDeDias.tsx`** — la semana de lunes a sábado con el día activo. Sirve para cualquier pantalla que se recorra por fecha.
- **`src/lib/asistencia/rachas.ts`** — `rachaDeAlumna()`, el cálculo de «N semanas sin venir». Lo comparten la pantalla de alertas y el aviso que aparece en la fila al tomar asistencia: no pueden discrepar.
- **Pie fijo con acción** (`TomarAsistenciaForm.tsx`) — `sticky bottom-[calc(4rem+env(safe-area-inset-bottom))]`, que es lo que lo deja justo arriba de la barra de pestañas. Patrón para cualquier formulario largo.
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

El módulo 5 fue el primero que necesitó tocar el esquema, y siguió el camino previsto: la migración (`alumnas.fecha_baja` + `deudas_saldadas`) se escribió y aplicó **en `main`**, se verificó contra el proyecto real (4 escenarios de constraint y la RLS con roles reales, todo con `rollback`, 0 filas de prueba restantes), se documentó en `docs/modelo-datos.md`, se pusheó, y recién ahí se mergeó a `nueva-ui` — sin mezclar esquema y UI en el mismo commit. El cálculo nuevo de deudoras se probó con un cliente Supabase falso: 19 casos, incluidos los tres de baja (de baja este mes sigue debiendo, de baja en marzo no, de baja sin fecha tampoco), el mes saldado que sale de la lista, los tres motivos de deuda, el recargo aplicado en un mes pasado y los cinco del armado del número de WhatsApp.

El módulo 4, que cambia cómo se guarda, se verificó además contra la base real: el guardado parcial y el borrado al desmarcar, dentro de una transacción con `rollback` (3 filas de 13, después 2 — la tabla quedó en 0, que es como estaba); la policy `asistencia_admin_headcoach_secretaria` es `for all`, así que el `delete` nuevo entra en el permiso que ya existía; y el cálculo de rachas se probó con siete casos de borde (racha de 3, semana sin marca salteada, presente que corta, semana en curso, volvió esta semana, sin registro, última presencia). **La tabla `asistencia` está vacía en producción**: el módulo nunca se usó, así que todavía no hay datos reales que mirar.

El módulo 7 sumó dos tandas de casos de borde sobre la lógica nueva, sin tocar la base:

- **La capa de datos de Planificaciones** (`lib/horarios/dia.ts`) con un cliente Supabase falso, 25 casos: que una fecha sin turno creado aparezca igual como clase (es lo que hace visible «Sin planificación»), que en ese caso no se le atribuya a nadie, que el sábado cuente, que una clase cancelada se muestre con su tipo, que «Mis clases» marque por `turno_profesores`, que el horario salga del bloque de `grupo_horarios` y no del turno, y los conteos del mes (9 fechas de Pre-competencia con 1 cargada, un grupo sin horario en 0, y las 8 que le faltan a la profesora).
- **El calendario de Torneos** (`lib/torneos/agrupar.ts` y `fechas.ts`), 19 casos: el evento en curso va con los próximos, los pasados salen del más reciente al más viejo, el destacado no se repite en la lista, el mismo mes de dos años distintos no se fusiona, y los tres formatos de rango con día de la semana.

**Ningún módulo se probó en el navegador desde estas sesiones**: no hubo herramienta de browser. Lauti revisa el preview de Vercel de `nueva-ui` — así detectó que faltaba el formulario de alta del módulo 3. El repaso con dos roles que pide el `02-` **sigue pendiente, también en el módulo 7**: en esta sesión sí había cómo levantar `next start` (las cinco rutas nuevas responden 307 a `/login`, sin errores de servidor), pero no hay credenciales de ninguna cuenta real ni forma de crear una de prueba sin la `service_role key`, así que las pantallas no se vieron con ningún rol. Para verificarlo de verdad hace falta una sesión con browser, o las credenciales de una cuenta de cada tipo.

Para tocar la base hace falta un **Personal Access Token** de Supabase (`sbp_...`), que Lauti genera en el momento — no queda guardado en el repo ni entre sesiones. El método está en `CLAUDE.md`.

> Ojo con `next build`: **no correrlo con un `next dev` activo**, pisa `.next` y deja el dev server sirviendo chunks rotos.
