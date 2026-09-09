# Lo que falta del rediseño

> **Documento temporal.** Es la hoja de ruta de lo que queda. Se escribió al cerrar la sesión del 2026-09-09 y se actualizó al cerrar el módulo 7, ese mismo día. Se borra cuando el rediseño termine.
>
> **No es el estado del proyecto.** El estado vigente vive en `docs/diseno/estado-del-rediseno.md` (los 8 módulos y sus commits), las decisiones en `docs/decisiones.md` y el trabajo abierto en `docs/pendientes.md`. Si algo de acá contradice a esos tres, **mandan ellos**.

---

## Dónde estamos

**7 de 8 módulos cerrados** en la rama `nueva-ui`, todos pusheados y visibles en el preview de Vercel.

| Módulo | Estado |
|---|---|
| 1 · Navegación e Inicio | ✅ |
| 2 · Miembros | ✅ salvo «Invitar» (falta la `service_role key`) |
| 3 · Tareas | ✅ + correcciones del 2026-09-09 |
| 4 · Asistencia | ✅ |
| 5 · Pagos | ✅ + corrección de anular pago |
| 6 · Alumnas | ✅ + correcciones del 2026-09-09 |
| 7 · Planificaciones y Torneos | ✅ |
| **8 · Participación en torneos** | ⬜ **el que sigue, y el último** |

`main` es lo que el club usa hoy y sigue intacta salvo por la migración del módulo 5 (`fecha_baja` + `deudas_saldadas`), que ya está aplicada y mergeada.

---

## Cómo arrancar la sesión

1. `git checkout nueva-ui && git pull`. Si `main` avanzó, `git merge main` antes de empezar.
2. Leer `CLAUDE.md` y `PROGRESS.md`.
3. Leer **enteras** las opciones `Tg` y `Th` de `docs/diseno/08-torneos.dc.html` — son la sección `T2`, arriba del todo del archivo (la sección `T` de más abajo, `Ta`–`Tf`, ya se construyó en el módulo 7). En el módulo 3 se saltó una opción y el formulario de alta quedó sin hacer hasta que lo detectaste en el preview.
4. Leer «Reglas que no se negocian» en `estado-del-rediseno.md`. La quinta es la importante: **cada cruce entre el modelo y los permisos lo decidís vos, en el momento**. En el módulo 7 salieron cuatro y los cuatro se preguntaron antes de escribir código.
5. Para tocar la base hace falta un Personal Access Token de Supabase (`sbp_...`) que generás en el momento; no queda guardado. El método está en `CLAUDE.md`.

---

## Módulo 8 — Participación en torneos

Es la única pantalla del rediseño que **no existe hoy**. Se construye sobre `torneo_participantes` (modelo aplicado en el Bloque 5 de las Correcciones pre-UI, sin pantallas) y sobre `torneos.inscripcion_monto`. El recorrido de `Tg` son tres pasos: el bloque nuevo en el detalle del torneo → el listado para convocar → la lista de convocadas con el control de inscripciones.

Tres cosas para tener a mano antes de escribir:

- **Los permisos ya están escritos** en `src/lib/permisos.ts` (`puedeGestionarConvocatoria`, `puedeVerConvocatoria`), pero `Th` los parte más fino que los dos helpers: **convocar, sacar alumnas y escribir la categoría es solo Admin/Head Coach** —es una decisión deportiva—, mientras que cambiar el estado de inscripción y registrar el pago suma Secretaria, que es el trabajo de Dai. Y **la Profesora ve nombres, no plata**: entra a la lista pero sin el monto ni el estado de pago. Cruzalo antes de escribir cualquier botón.
- **Empleado/a y Patinador/a no ven nada de esto** — ni la lista, ni el bloque del detalle, ni las cifras, ni por URL. Ojo que hoy la RLS de `torneo_participantes` no está verificada contra ese alcance (ver `docs/pendientes.md`); si hay que acotarla, va en `main`.
- **Dos cosas decididas que conviene no volver a discutir:** la categoría es **texto libre** («C5 9», «FM 11»), escrito por quien arma la lista — se decidió explícitamente no modelar categorías federativas ni derivarlas de la edad; y **`alumnas.fecha_nacimiento` está vacía en las 158**, y el módulo se construye igual: la fecha es una columna más de la planilla que se manda a la organización, no se usa para calcular nada. Las alumnas sin el dato aparecen en el listado y al exportar se avisa cuántas faltan. **Recordáselo a Lauti al arrancar** por si prefiere cargarlas antes para probarlo con datos reales. Si aparece algo que sí se rompa sin el dato, frenar y avisar — no inventar un valor por defecto.

Lo que el módulo 7 decidió sobre cómo se ve un torneo manda acá: el chip de tipo sin emoji, el destacado que no se repite en la lista, y el ícono de nota como señal de contenido largo.

---

## Lo que queda abierto además del módulo 8

### Verificación en el navegador — lo más importante

**Ningún módulo del rediseño se probó en el navegador desde estas sesiones**, el 7 incluido: no hubo herramienta de browser en ninguna, y en la del módulo 7 tampoco había credenciales de ninguna cuenta real. Lo que hay es `tsc --noEmit` y `next build` limpios, verificaciones contra la base real con `rollback`, y —desde el módulo 7— casos de borde sobre la lógica nueva con un cliente Supabase falso. Vos revisás el preview de Vercel: así aparecieron el formulario de alta que faltaba (módulo 3), el botón de anular pago (módulo 5) y las correcciones del 2026-09-09.

El repaso que pide la regla —**cada módulo probado con un rol de gestión y uno del personal**— sigue pendiente en los siete. El detalle de qué mirar, módulo por módulo, está en `docs/pendientes.md`, sección «Verificación en el navegador»; el del módulo 7 es el más largo porque es el que más roles cruza.

Para verificarlo de verdad hace falta una sesión con browser, las credenciales de una cuenta de cada tipo, o una cuenta de prueba con rol Secretaria creada desde el Dashboard de Supabase.

### Cosas que dependen de vos, no del código

- **`alumnas.fecha_nacimiento` vacía en las 158.** Hasta que las cargues, ninguna ficha muestra la edad. No bloquea nada, tampoco el módulo 8.
- **Los 11 Personal Access Tokens de Supabase sin revocar**, en supabase.com/dashboard/account/tokens. No se pueden revocar desde una sesión de Claude Code: la Management API no expone gestión de tokens.
- **«Invitar» del módulo 2** necesita `SUPABASE_SERVICE_ROLE_KEY` en Vercel y en `.env.local`. Mientras tanto las altas de personal se hacen desde el Dashboard de Supabase. Esa misma key es la que permitiría crear cuentas de prueba para verificar por rol.
- **Un Profesor puede duplicar la planificación de una clase ajena por URL** (detectado al consolidar los permisos en el módulo 7, no introducido ahí). No se tocó porque es un cruce de permisos que el modelo no cubre: decidilo vos. Alinearlo es cambiar un helper por otro.

### Deuda técnica anotada

- **La RLS de Planificaciones no acompaña a los gates del módulo 7**: `turnos`, `turno_profesores` y `turno_comentarios` siguen abiertos a cualquier autenticado, así que la única defensa contra una alumna leyendo planificaciones por la API es la aplicación. Es cambio de RLS: va en `main`.
- **La RLS de `users` deja leer el email a cualquier autenticado** (`users_select_authenticated USING true`). Mismo caso. Lo que hay que cerrar es la **columna** `email`, no la tabla — varias pantallas leen `users` para mostrar nombres.
- **Baja de personal sin pantalla**: `users.estado` existe y los listados ya filtran, pero la baja se carga a mano en la base.
- `tarea_visible_para_head_coach(uuid)` quedó sin uso y se puede dropear si se confirma que nadie la llama.
- La migración de F2 MOD 4 no tiene fila en `supabase_migrations.schema_migrations`.
- Los 4 turnos viejos con `grupo_legacy` sin mapear a `grupo_id`.

---

## Al cerrar el módulo 8

Lo de siempre, que está en `CLAUDE.md`:

1. Mover la fila en la tabla de `docs/diseno/estado-del-rediseno.md` y anotar el sha.
2. Sumar la fila de la sesión en `docs/historial/2026-09.md`.
3. Si hubo una decisión de producto nueva o cambió una vigente: `docs/decisiones.md`.
4. Si queda algo abierto: `docs/pendientes.md`. Si se cerró un pendiente: borrarlo de ahí.
5. Actualizar `PROGRESS.md`: el rediseño pasa de 🟡 a ✅ y la fila de «Participación en torneos» también.
6. Un commit por módulo, y push — el preview de Vercel es donde lo mirás.
7. **Y este archivo se borra**: era la hoja de ruta de lo que faltaba, y no falta más nada.
