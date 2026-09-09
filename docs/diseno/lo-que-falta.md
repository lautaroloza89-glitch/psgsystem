# Lo que falta del rediseño

> **Documento temporal.** Es la hoja de ruta de lo que queda, escrita al cerrar la sesión del 2026-09-09. Se borra cuando el rediseño termine.
>
> **No es el estado del proyecto.** El estado vigente vive en `docs/diseno/estado-del-rediseno.md` (los 8 módulos y sus commits), las decisiones en `docs/decisiones.md` y el trabajo abierto en `docs/pendientes.md`. Si algo de acá contradice a esos tres, **mandan ellos**: este archivo se escribió una vez y no se actualiza solo.

---

## Dónde estamos

**6 de 8 módulos cerrados** en la rama `nueva-ui`, todos pusheados y visibles en el preview de Vercel.

| Módulo | Estado |
|---|---|
| 1 · Navegación e Inicio | ✅ |
| 2 · Miembros | ✅ salvo «Invitar» (falta la `service_role key`) |
| 3 · Tareas | ✅ + correcciones del 2026-09-09 |
| 4 · Asistencia | ✅ |
| 5 · Pagos | ✅ + corrección de anular pago |
| 6 · Alumnas | ✅ + correcciones del 2026-09-09 |
| **7 · Planificaciones y Torneos** | ⬜ **el que sigue** |
| 8 · Participación en torneos | ⬜ |

`main` es lo que el club usa hoy y sigue intacta salvo por la migración del módulo 5 (`fecha_baja` + `deudas_saldadas`), que ya está aplicada y mergeada.

---

## Cómo arrancar la sesión

1. `git checkout nueva-ui && git pull`. Si `main` avanzó, `git merge main` antes de empezar.
2. Leer `CLAUDE.md` y `PROGRESS.md`.
3. Leer **enteros** los dos modelos del módulo 7: `docs/diseno/07-planificaciones.dc.html` y `docs/diseno/08-torneos.dc.html`, con todas sus opciones (`Xa`, `Xb`, `Xc`…). En el módulo 3 se saltó una opción y el formulario de alta quedó sin hacer hasta que lo detectaste en el preview.
4. Leer «Reglas que no se negocian» en `estado-del-rediseno.md`. La quinta es la importante: **cada cruce entre el modelo y los permisos lo decidís vos, en el momento** — no se resuelve por cuenta propia ni se deja anotado para después.
5. Para tocar la base hace falta un Personal Access Token de Supabase (`sbp_...`) que generás en el momento; no queda guardado. El método está en `CLAUDE.md`.

---

## Módulo 7 — Planificaciones y Torneos

Es el primero que junta **dos pantallas distintas** en un módulo, y el que más roles distintos tiene mirando lo mismo. Tres cosas para tener a mano antes de escribir:

- **Es el único módulo donde escribe la Profesora.** El permiso vive fuera del archivo único: `puedeCargarPlanificaciones`, dentro de `horarios/planificaciones-actions.ts`. Cruzalo con el modelo antes de escribir cualquier botón.
- **Torneos lo ve todo el club**, incluidos Profesor y Empleado, que no entran a ningún otro módulo de los rediseñados. `puedeVerTorneos` deja pasar a cualquiera logueado; crear y editar es solo Admin/Head Coach; la convocatoria suma Secretaria.
- **Ojo con `/horarios`:** ya se rediseñó su entrada una vez (parche del 2026-09-01, grupo → mes → planificaciones). Lo que el modelo proponga se escribe encima de eso, no de la grilla vieja.

Lo que el modelo pide, en una línea: pestañas Próximos/Pasados, no duplicar el destacado, y una señal de que una clase tiene notas.

## Módulo 8 — Participación en torneos

Va última porque **es la única pantalla que no existe hoy**. Se construye sobre `torneo_participantes` (modelo aplicado en el Bloque 5 de las Correcciones pre-UI, sin pantallas) y sobre las categorías.

Dos cosas decididas que conviene no volver a discutir:

- **La categoría es texto libre** («C5 9», «FM 11»), escrito por quien arma la lista. Se decidió explícitamente **no** modelar categorías federativas ni derivarlas de la edad.
- **`alumnas.fecha_nacimiento` está vacía en las 158**, y el módulo se construye igual: la fecha es una columna más de la planilla que se manda a la organización del torneo, no se usa para calcular nada. Las alumnas sin el dato aparecen en el listado y al exportar se avisa cuántas faltan. **Recordáselo a Lauti al arrancar** por si prefiere cargarlas antes para probarlo con datos reales. Si aparece algo que sí se rompa sin el dato, frenar y avisar — no inventar un valor por defecto.

---

## Lo que queda abierto además de los dos módulos

### Verificación en el navegador — lo más importante

**Ningún módulo del rediseño se probó en el navegador desde estas sesiones**: no hubo herramienta de browser en ninguna. Lo que hay es `tsc --noEmit` y `next build` limpios, más verificaciones contra la base real con `rollback`. Vos revisás el preview de Vercel — así aparecieron el formulario de alta que faltaba (módulo 3), el botón de anular pago (módulo 5) y las correcciones del 2026-09-09.

El repaso que pide la regla —**cada módulo probado con un rol de gestión y uno del personal**— sigue pendiente en los seis módulos. El módulo 7 es el mejor momento para hacerlo, porque es justamente el que más roles cruza.

Si en alguna sesión hay browser, o si se crea una cuenta de prueba con rol Secretaria desde el Dashboard, se puede verificar de verdad. Incluso sin browser: levantando `next start`, pidiendo el token con la anon key y haciendo `curl` con la cookie de sesión.

El detalle de qué mirar en cada módulo viejo está en `docs/pendientes.md`, sección «Verificación en el navegador».

### Cosas que dependen de vos, no del código

- **`alumnas.fecha_nacimiento` vacía en las 158.** Hasta que las cargues, ninguna ficha muestra la edad. No bloquea nada.
- **Los 11 Personal Access Tokens de Supabase sin revocar**, en supabase.com/dashboard/account/tokens. No se pueden revocar desde una sesión de Claude Code: la Management API no expone gestión de tokens.
- **«Invitar» del módulo 2** necesita `SUPABASE_SERVICE_ROLE_KEY` en Vercel y en `.env.local`. Mientras tanto las altas de personal se hacen desde el Dashboard de Supabase.

### Deuda técnica anotada

- **La RLS de `users` deja leer el email a cualquier autenticado** (`users_select_authenticated USING true`). La app ya no lo muestra, pero la RLS no acompaña. Es cambio de RLS: va en `main`. Ojo, lo que hay que cerrar es la **columna** `email`, no la tabla — varias pantallas leen `users` para mostrar nombres.
- **Baja de personal sin pantalla**: `users.estado` existe y los listados ya filtran, pero la baja se carga a mano en la base.
- `tarea_visible_para_head_coach(uuid)` quedó sin uso y se puede dropear si se confirma que nadie la llama.
- La migración de F2 MOD 4 no tiene fila en `supabase_migrations.schema_migrations`.
- Los 4 turnos viejos con `grupo_legacy` sin mapear a `grupo_id`.

---

## Al cerrar el módulo 7

Lo de siempre, que está en `CLAUDE.md`:

1. Mover la fila en la tabla de `docs/diseno/estado-del-rediseno.md` y anotar el sha.
2. Sumar la fila de la sesión en `docs/historial/2026-09.md`.
3. Si hubo una decisión de producto nueva o cambió una vigente: `docs/decisiones.md`.
4. Si queda algo abierto: `docs/pendientes.md`. Si se cerró un pendiente: borrarlo de ahí.
5. Actualizar el contador de `PROGRESS.md` («7 de 8 módulos»).
6. Un commit por módulo, y push — el preview de Vercel es donde lo mirás.
