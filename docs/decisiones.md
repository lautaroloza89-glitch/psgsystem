# Decisiones de producto vigentes

> Las reglas y alcances que el sistema respeta **hoy**. Una entrada por decisión, sin fechas de sesión ni el paso a paso de cómo se llegó: eso vive en `docs/historial/YYYY-MM.md`.
> Si una decisión fue reemplazada por otra más nueva, acá figura solo la vigente.
> El estado de avance de cada módulo vive en la tabla de `PROGRESS.md`. El plan por fases, en `docs/roadmap-general.md`. El detalle técnico de tablas y campos, en `docs/modelo-datos.md`.

---

## Índice

**Producto y stack**
[Alcance del producto](#alcance-del-producto) · [Stack técnico](#stack-técnico) · [Estructura de carpetas](#estructura-de-carpetas)

**Roles y permisos**
[Los roles son niveles de permiso, no cargos](#los-roles-son-niveles-de-permiso-no-cargos) · [Alcance de cada rol](#alcance-de-cada-rol) · [Alcance del rol Secretaria](#alcance-del-rol-secretaria) · [Asignación de roles del equipo real](#asignación-de-roles-del-equipo-real) · [Head Coach con control total sobre clases](#head-coach-con-control-total-sobre-clases) · [Sin auto-registro público](#sin-auto-registro-público) · [La RLS es la fuente de verdad de los permisos](#la-rls-es-la-fuente-de-verdad-de-los-permisos) · [Las reglas de permiso viven en un solo archivo](#las-reglas-de-permiso-viven-en-un-solo-archivo) · [dicta_clases es independiente del rol](#dicta_clases-es-independiente-del-rol)

**Tareas**
[Tareas y proyectos son la misma entidad](#tareas-y-proyectos-son-la-misma-entidad) · [Una tarea puede tener varios responsables](#una-tarea-puede-tener-varios-responsables) · [Los comentarios son historial](#los-comentarios-son-historial) · [Aviso cuando una tarea queda sin responsables](#aviso-cuando-una-tarea-queda-sin-responsables)

**Clases y planificaciones**
[Las clases son por fecha puntual, no recurrentes](#las-clases-son-por-fecha-puntual-no-recurrentes) · [Cancelar no es borrar](#cancelar-no-es-borrar) · [Una clase puede tener varios profesores](#una-clase-puede-tener-varios-profesores) · [El horario del club es de lectura abierta](#el-horario-del-club-es-de-lectura-abierta) · [La entrada a Planificaciones es grupo → mes](#la-entrada-a-planificaciones-es-grupo--mes)

**Notificaciones**
[Alcance de las notificaciones](#alcance-de-las-notificaciones) · [Destinatarios de una notificación](#destinatarios-de-una-notificación) · [Push con Web Push API nativo](#push-con-web-push-api-nativo) · [Los recordatorios de vencimiento corren por cron](#los-recordatorios-de-vencimiento-corren-por-cron) · [Las notificaciones sobreviven al borrado de su origen](#las-notificaciones-sobreviven-al-borrado-de-su-origen)

**Alumnas, grupos y cuotas**
[Las alumnas no tienen cuenta ni login](#las-alumnas-no-tienen-cuenta-ni-login) · [Los grupos son un catálogo fijo](#los-grupos-son-un-catálogo-fijo) · [La cuota es solo el valor vigente](#la-cuota-es-solo-el-valor-vigente) · [Campos opcionales en base, obligatorios en el formulario](#campos-opcionales-en-base-obligatorios-en-el-formulario) · [Las bajas son lógicas, no borrados](#las-bajas-son-lógicas-no-borrados)

**Pagos**
[Se permite el pago parcial](#se-permite-el-pago-parcial) · [El recargo es fijo y sugerido, no automático](#el-recargo-es-fijo-y-sugerido-no-automático) · [Dos transiciones de pago: verificar y anular](#dos-transiciones-de-pago-verificar-y-anular) · [El historial financiero no se borra](#el-historial-financiero-no-se-borra) · [El recibo se arma recién al verificar](#el-recibo-se-arma-recién-al-verificar)

**Asistencia**
[Asistencia sin sábados](#asistencia-sin-sábados) · [Presente o ausente, sin tercer estado](#presente-o-ausente-sin-tercer-estado) · [El grupo del día queda congelado en la fila](#el-grupo-del-día-queda-congelado-en-la-fila) · [La alerta de inasistencias se mide en semanas](#la-alerta-de-inasistencias-se-mide-en-semanas)

**Torneos**
[Torneos cubre solo el registro](#torneos-cubre-solo-el-registro) · [Torneos, exhibiciones y eventos en una sola tabla](#torneos-exhibiciones-y-eventos-en-una-sola-tabla) · [El estado de un torneo se calcula, no se guarda](#el-estado-de-un-torneo-se-calcula-no-se-guarda) · [Torneos es información de todo el club](#torneos-es-información-de-todo-el-club)

**Transversales**
[Un solo criterio de fecha: hoyArgentina()](#un-solo-criterio-de-fecha-hoyargentina) · [Los reportes se consultan, no avisan](#los-reportes-se-consultan-no-avisan) · [Markdown en descripciones y comentarios](#markdown-en-descripciones-y-comentarios)

---

## Alcance del producto

**Decisión:** sistema tipo Asana/ClickUp simplificado, hecho a medida para una escuela de patín (equipo chico, máx. 10 personas), construido como **PWA**: un solo código que corre en el navegador y se instala en el celular sin pasar por App Store / Play Store. No maneja carga de archivos, fotos ni audios.
**Contexto:** reemplaza suscripciones pagas por una herramienta propia. La PWA evita el costo y la fricción de publicar en las tiendas para un equipo de 10 personas. La carga de archivos quedó fuera de alcance a propósito, para no arrastrar storage ni moderación de contenido.
**Estado:** vigente

## Stack técnico

**Decisión:** Next.js (React) + TypeScript + Tailwind CSS en el frontend; manifest + service worker para la PWA; Supabase (Postgres, Auth, RLS, Edge Functions) como backend; deploy en Vercel con auto-deploy desde GitHub. Ambos en plan gratuito.
**Contexto:** todo el backend vive en un solo proveedor, lo que evita sumarle cuentas y dependencias externas a un equipo chico — el mismo criterio que después decidió el push nativo por sobre OneSignal/Firebase.
**Estado:** vigente

## Estructura de carpetas

**Decisión:** el código se agrupa por dominio, no por tipo de archivo. Cada módulo tiene su carpeta de rutas en `src/app/(dashboard)/<modulo>/` con su `actions.ts` propio, sus componentes en `src/components/<modulo>/`, y lo compartido en `src/components/ui/`, `src/lib/` y `src/types/`. Las migraciones SQL viven en `supabase/migrations/`. Esqueleto original:

```
escuela-patin-app/
├── PROGRESS.md              ← estado de módulos y reglas de trabajo
├── docs/
│   ├── modelo-datos.md      ← tablas y campos
│   ├── decisiones.md        ← este archivo
│   ├── historial/           ← log de sesiones archivado por mes
│   ├── roadmap-general.md   ← plan por fases
│   └── mapa-horarios.md     ← mapa aparte de horarios/turnos
├── public/
│   ├── manifest.json
│   └── icons/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   ├── tareas/
│   │   │   └── horarios/
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/               ← botones, inputs, cards genéricos
│   │   ├── tareas/
│   │   ├── horarios/
│   │   └── dashboard/
│   ├── lib/
│   │   ├── supabase/         ← cliente y queries
│   │   └── utils/
│   ├── types/                ← Task, User, Turno, etc.
│   └── hooks/
├── supabase/
│   └── migrations/           ← SQL de tablas
├── .env.local
└── package.json
```

Los módulos de Fase 2 (alumnas, pagos, asistencia, torneos) siguen el mismo patrón sin que este árbol los liste uno por uno.
**Contexto:** el árbol se fijó al arrancar el proyecto, antes de escribir la primera pantalla, para que cada módulo nuevo tuviera un lugar obvio y las sesiones no inventaran una organización distinta cada vez.
**Estado:** vigente

## Los roles son niveles de permiso, no cargos

**Decisión:** `users.rol` define 6 niveles de permiso (Admin, Head Coach, Profesor, Secretaria, Empleado, Patinador). Varios puestos del club pueden compartir el mismo rol. Para diferenciar a dos personas con el mismo rol existe `users.cargo`: texto libre, descriptivo, **sin efecto alguno en permisos**.
**Contexto:** el club tiene más puestos que niveles de acceso reales (dos profesoras con especialidades distintas necesitan los mismos permisos). Separar rol de cargo evita crear un rol nuevo cada vez que aparece un puesto nuevo. Detalle en `docs/roles-actualizacion.md`.
**Estado:** vigente

## Alcance de cada rol

**Decisión:**

| Rol | Puede |
|---|---|
| **Admin** (dueño) | Crear/editar/borrar todo. Ver todo. Gestionar usuarios y permisos. |
| **Profesor** | Crear y gestionar sus tareas y sus horarios asignados. |
| **Head Coach** | Sobre **tareas**: mismos permisos que Profesor sobre las propias (crear/editar/borrar lo suyo), más lectura de las de Profesor, Empleado y Patinador. Sin edición/borrado de tareas ajenas. Sobre **horarios/turnos**: control total, igual que Admin. Sin gestión de usuarios. |
| **Empleado** | Ve solo lo asignado a él. Puede cambiar el estado de su propia tarea (Pendiente → En progreso → Completada) y dejar un comentario corto. NO edita estructura, fechas ni asignados. |
| **Patinador** | Mismos permisos que Empleado, con una excepción: **no accede al módulo de Tareas** — `/tareas` y `/tareas/[id]` lo redirigen a `/dashboard`, y no puede cambiar el estado de una tarea aunque figure asignado. Tampoco entra a `/miembros`. |
| **Secretaria** | Ver la entrada [Alcance del rol Secretaria](#alcance-del-rol-secretaria). |

**Contexto:** cada rol se fue acotando contra un caso real del club, no a priori. El caso Patinador es el más particular: el rol existe para que las alumnas con login vean el calendario y los torneos, no para que participen de la gestión interna — por eso queda afuera de Tareas y Miembros aunque su nivel de permiso base sea el de Empleado.
**Estado:** vigente

## Alcance del rol Secretaria

**Decisión:** rol para el dominio administrativo.
- **Completo:** Alumnas, Asistencia, Pagos (registrar, recargo, verificar, anular, deudoras, saldo por alumna) y Tareas (ve todas, crea, asigna, edita y cierra; borra solo las propias).
- **Solo lectura:** Planificaciones, Torneos y Miembros (con emails).
- **Nunca:** la recaudación total del club (`/pagos/recaudacion`), la gestión del equipo (no invita, no cambia roles, no da de baja), la escritura en planificaciones, crear/editar torneos y cambiar cuotas de grupo.

**Contexto:** el dominio administrativo se cubría dándole `Admin` a Dai, que le daba control total sobre Tareas, Horarios y gestión de usuarios — mucho más de lo que el puesto necesita. La alternativa descartada fue dejarla en Admin y confiar en el uso; se optó por un rol propio para que el límite lo ponga el sistema y no el criterio de la persona. La recaudación total queda afuera por ser información sensible del club, no por falta de confianza operativa: registra y verifica cada pago, pero no ve el agregado.
**Estado:** vigente

## Asignación de roles del equipo real

**Decisión:**

| Persona | Email | Rol | Cargo |
|---|---|---|---|
| Lautaro Loza (desarrollador) | `lautaroloza89@gmail.com` | Admin | — |
| Luciana Giacometti (Coordinadora Principal, dueña) | `patinsaintgermain@gmail.com` | Head Coach | Entrenadora Principal |
| Dai (cuotas, pagos, asistencias) | `dai@gmail.com` | Secretaria | Administración |
| Keyla (carga planificaciones) | `keyla@gmail.com` | Profesor | Preparadora Física |
| Carolina | `carolina@gmail.com` | Empleado | Entrenadora Asistente |
| Estefania | `estefania@gmail.com` | Empleado | Ayudante |
| Malena | `malena@gmail.com` | Empleado | Ayudante |

Lautaro es el único Admin real del sistema.
**Contexto:** Luciana, dueña del club, pasó de Admin a Head Coach a sabiendas de que pierde la gestión de usuarios y la vista total — su trabajo real es armar planificaciones y clases, que es exactamente lo que Head Coach cubre. Dejar un solo Admin evita que la gestión de permisos quede repartida.
**Estado:** vigente

## Head Coach con control total sobre clases

**Decisión:** sobre horarios/turnos, Head Coach tiene el mismo control que Admin: crea clases y reasigna el profesor de cualquiera, no solo de las propias. El **borrado** de clases sigue siendo Admin-only. Sobre tareas el alcance no cambia (solo lo propio, más la lectura ampliada).
**Contexto:** Luciana arma la mayor parte de las planificaciones de clases y necesita poder asignárselas a cualquier profesor. Con las reglas originales (Head Coach = Profesor sobre lo propio) el formulario ni siquiera le mostraba el dropdown de profesor.
**Estado:** vigente

## Sin auto-registro público

**Decisión:** no hay registro abierto. El Admin da de alta la cuenta desde el Dashboard de Supabase Auth y el login es email + password. Un trigger (`handle_new_user`) crea la fila en `public.users` leyendo `nombre`/`rol` de los metadatos; si no vienen, el default es `rol='Empleado'`.
**Contexto:** el sistema es interno para un equipo de 10 personas, no un producto con usuarios que se registran solos. El default `Empleado` aplica mínimo privilegio: una cuenta creada sin metadatos no arranca con permisos de más.
**Estado:** vigente

## La RLS es la fuente de verdad de los permisos

**Decisión:** los permisos se definen en las políticas RLS de Postgres. Las server actions y las páginas replican el mismo criterio para mostrar u ocultar acciones y para cortar temprano, pero no son la única barrera: si el gate de la app falla, la RLS igual rechaza la operación.
**Contexto:** dos capas independientes hacen que un olvido en una pantalla nueva no se convierta en un agujero. Cuando las dos capas se contradijeron (por ejemplo, un botón que excluía a Secretaria mientras la action la dejaba pasar), la corrección fue alinear la app a la RLS, no al revés.
**Estado:** vigente

## Las reglas de permiso viven en un solo archivo

**Decisión:** las condiciones de permiso de la aplicación se escriben una sola vez, en `src/lib/permisos.ts`, y las consumen tanto las páginas como las server actions. Nada de repetir la misma comparación de roles en cada pantalla.
**Contexto:** la regla de Pagos estaba repetida literal en las cuatro pantallas del módulo y en un helper local de sus actions; cualquier ajuste de alcance obligaba a tocar cinco lugares y acertar en los cinco. Las transiciones destructivas van en su propio helper aparte (`puedeAnularPago`, separado de `puedeGestionarPagos`), para poder acotarlas sin arrastrar el resto.
**Estado:** vigente

## dicta_clases es independiente del rol

**Decisión:** `users.dicta_clases` (booleano, default `false`) marca quién puede aparecer como profesor asignable a una clase. Es independiente del rol de permisos y no toca la RLS.
**Contexto:** la dueña dicta clases y la secretaria no, pero en su momento ambas compartían el rol `Admin`. Hacía falta una marca ortogonal al rol, no un rol nuevo.
**Estado:** vigente

## Tareas y proyectos son la misma entidad

**Decisión:** no hay tabla de proyectos. Tareas y proyectos se unifican en `tareas`.
**Contexto:** para un equipo de 10 personas, una jerarquía proyecto → tarea agregaba una pantalla y un nivel de navegación sin resolver ningún problema real.
**Estado:** vigente

## Una tarea puede tener varios responsables

**Decisión:** la relación tarea ↔ responsables es muchos a muchos (`tarea_asignados`), no una FK única. Los responsables se eligen con un checklist de personas. Al editar una tarea se calcula el diff de altas y bajas y solo se tocan las filas que cambiaron.
**Contexto:** el trabajo real del club se reparte entre varias personas. El diff no es un detalle de performance: los avisos de asignación se disparan por fila nueva en `tarea_asignados`, así que borrar y reinsertar a todos en cada edición le reenviaría la notificación a quien ya estaba asignado.
**Estado:** vigente

## Los comentarios son historial

**Decisión:** los comentarios (de tareas y de clases) son un registro cronológico: se agregan, no se editan. El borrado queda reservado a Admin.
**Contexto:** el valor del comentario está en dejar rastro de qué pasó y cuándo; permitir edición lo convertiría en un campo de texto más.
**Estado:** vigente

## Aviso cuando una tarea queda sin responsables

**Decisión:** si al quitar responsables una tarea queda con cero, se notifica a los Admin reales.
**Contexto:** una tarea sin nadie asignado desaparece de la vista de todo el mundo sin que nadie se entere. La alternativa era prohibir el estado (bloquear el borrado del último responsable), que complicaba el flujo normal de reasignar; el aviso deja pasar la operación y avisa.
**Estado:** vigente

## Las clases son por fecha puntual, no recurrentes

**Decisión:** cada clase es una fila con fecha propia. No hay recurrencia: una clase semanal son N filas, generadas al planificar el mes.
**Contexto:** permite cancelar o modificar un día suelto sin tocar el resto ni inventar excepciones sobre una regla de repetición.
**Estado:** vigente

## Cancelar no es borrar

**Decisión:** las clases tienen estado Activo/Cancelado y la cancelación es un toggle reversible (se puede reactivar). El borrado real existe aparte, con confirmación, y es solo para Admin. Visualmente se distinguen: "Cancelar clase" en ámbar, "Borrar clase" en rojo.
**Contexto:** cancelar un día es una operación frecuente y esperable; borrar es excepcional y destruye historial. Que compartieran el color rojo los hacía fáciles de confundir.
**Estado:** vigente

## Una clase puede tener varios profesores

**Decisión:** la relación clase ↔ profesores es muchos a muchos (`turno_profesores`), mismo patrón que `tarea_asignados`. Admin y Head Coach asignan a cualquiera con un checklist; un Profesor solo puede autoasignarse o quitarse. Cada asignación nueva genera su propia notificación, sin reenviar a quien ya estaba.
**Contexto:** hay clases con dos profesoras a la vez (Caro/Dai entre semana, Male/Estefi los sábados), que el modelo original de una sola FK no podía representar.
**Estado:** vigente

## El horario del club es de lectura abierta

**Decisión:** cualquier usuario autenticado ve el horario completo del club, no solo sus propias clases. Las notificaciones sí van dirigidas únicamente a los asignados.
**Contexto:** es un horario compartido, no información privada por profesor. Se confirmó explícitamente al construir el multi-profesor, cuando el pedido sugería restringir por rol: se mantuvo abierto.
**Estado:** vigente

## La entrada a Planificaciones es grupo → mes

**Decisión:** `/horarios` es el selector de grupo. Se elige grupo, después mes, y ahí se ven las planificaciones, con los filtros Todas/Activo/Cancelado adentro de esa vista.
**Contexto:** antes la entrada era una grilla con las planificaciones de todos los grupos mezcladas más un link a la vista por grupo — dos pantallas donde iba una, y la que se usaba de verdad era la segunda.
**Estado:** vigente

## Alcance de las notificaciones

**Decisión:** las notificaciones (campana + push) cubren **tareas** (asignación, comentario, vencimiento, tarea sin responsables) y **clases** (asignación, comentario). No hay notificaciones de pagos, asistencia ni torneos.
**Contexto:** decisión de alcance confirmada explícitamente. Los avisos de los módulos administrativos se resolvieron como reportes que se consultan, no como notificaciones. No hay "vencimiento" de clase porque el horario de un grupo es fijo.
**Estado:** vigente

## Destinatarios de una notificación

**Decisión:** para una tarea, los destinatarios son la unión de los responsables asignados y el creador de la tarea, sin duplicados, excluyendo a quien originó la acción. Para una clase, los profesores asignados, excluyendo al autor. La autoasignación no genera aviso propio.
**Contexto:** incluir al creador aunque no esté asignado permite que se entere de lo que pasa en una tarea que delegó. Excluir al autor evita el aviso de la propia acción. El mensaje de comentario no incluye el texto del comentario, para no filtrar contenido en una notificación de pantalla bloqueada.
**Estado:** vigente

## Push con Web Push API nativo

**Decisión:** las notificaciones push usan la Web Push API nativa (VAPID + service worker + Edge Function), sin OneSignal ni Firebase. El permiso del navegador se pide automáticamente al loguearse, sin botón aparte. El disparador se engancha a la tabla `notificaciones`, no a cada trigger: cualquier tipo de aviso nuevo queda cubierto por push sin cambios adicionales.
**Contexto:** sumar un proveedor externo implicaba una cuenta y una dependencia más para un equipo de 10 personas cuando todo lo demás ya vive en Supabase. El permiso automático se acordó porque al equipo se le avisa de antemano que lo acepte.
**Estado:** vigente

## Los recordatorios de vencimiento corren por cron

**Decisión:** los avisos de tarea por vencer y vencida los genera un job de `pg_cron` diario a las 08:00 Argentina, no un chequeo al abrir el dashboard. Los umbrales son en días completos: 2 días antes, 1 día antes, y vencida. Cada combinación de tarea + destinatario + tipo se avisa una sola vez.
**Contexto:** con un chequeo al cargar la app, el aviso no llega los días que nadie entra. Los umbrales son en días y no en horas porque `fecha_vencimiento` es `date`, sin componente de hora — la propuesta original de "48hs/16hs antes" no se podía calcular con precisión sobre ese tipo de dato. El dedup evita que el cron reenvíe el mismo aviso cada día mientras la tarea siga pendiente.
**Estado:** vigente

## Las notificaciones sobreviven al borrado de su origen

**Decisión:** `notificaciones.tarea_id` y `notificaciones.turno_id` son `on delete set null`, no cascade.
**Contexto:** borrar una tarea no debería destruir el historial de notificaciones de otras personas como efecto colateral. Mismo patrón que `tareas.created_by`.
**Estado:** vigente

## Las alumnas no tienen cuenta ni login

**Decisión:** `alumnas` son datos puros, sin cuenta de Auth y sin relación con el rol `Patinador` de Fase 1. Una alumna del listado y una usuaria con login son cosas distintas del sistema.
**Contexto:** son ~158 registros administrativos (quién está en qué grupo, quién paga, quién asiste), no usuarias del sistema. Atarlos al rol Patinador habría obligado a crear una cuenta por alumna.
**Estado:** vigente

## Los grupos son un catálogo fijo

**Decisión:** `grupos` es un catálogo cerrado de 5 grupos/niveles, con sus bloques horarios en tabla aparte (`grupo_horarios`) porque un grupo puede tener más de uno — Jungla tiene dos. Los días se guardan como `smallint[]` con la convención ISO (1=lunes … 7=domingo). Las clases se atan a `grupos` por FK real (`turnos.grupo_id`).
**Contexto:** la convención ISO se eligió para que Planificaciones y Asistencia puedan filtrar y calcular fechas directamente en SQL, en vez de parsear texto libre. La FK reemplazó al texto libre anterior (`turnos.grupo_nivel`, hoy `grupo_legacy`), que permitía escribir el mismo grupo de cinco formas distintas.
**Estado:** vigente

## La cuota es solo el valor vigente

**Decisión:** `grupos.cuota_mensual` guarda únicamente el valor vigente, sin historial de cambios de precio.
**Contexto:** el historial de lo efectivamente cobrado ya vive en `pagos`, que guarda el snapshot del monto de cuota al momento de cada pago. Una tabla de historial de precios sería un segundo registro de lo mismo.
**Estado:** vigente

## Campos opcionales en base, obligatorios en el formulario

**Decisión:** `alumnas.dni`, `alumnas.grupo_id` y `contactos.relacion` son nullable en la base. El DNI tiene índice único **parcial** (solo sobre las filas que lo tienen). La obligatoriedad se aplica en el formulario de alta, no en el esquema.
**Contexto:** el import del listado real trae fichas incompletas — de hecho las 158 alumnas importadas no tienen DNI. Un NOT NULL en base habría bloqueado el import de datos que sí sirven; la validación en el formulario mantiene la exigencia para la carga manual sin impedir que exista una ficha a medio completar.
**Estado:** vigente

## Las bajas son lógicas, no borrados

**Decisión:** dar de baja es un cambio de estado, no un `delete`. Las alumnas tienen estado activa/baja (los listados filtran por Activas por default); el personal tiene `users.estado`, y los listados y selectores ya filtran por él.
**Contexto:** una alumna dada de baja conserva su historial de pagos y asistencia, y puede volver. Nota operativa: todavía **no hay pantalla** para dar de baja a alguien del personal — la app no tiene gestión de usuarios, así que por ahora se carga a mano en la base.
**Estado:** vigente

## Se permite el pago parcial

**Decisión:** un pago puede cubrir parte de la cuota del mes. `monto` es lo efectivamente cobrado en ese evento puntual, y el saldo de una alumna para un mes se calcula sumando sus pagos. Un mismo pago puede desglosarse en varios métodos (`pagos_metodos`).
**Contexto:** las familias pagan en cuotas y a veces en efectivo y transferencia a la vez. Modelar el pago como "el mes está pago o no" no representaba lo que pasa en el mostrador.
**Estado:** vigente

## El recargo es fijo y sugerido, no automático

**Decisión:** recargo fijo de $10.000, que aparece como checkbox **sugerido y editable** cuando ya pasó el día 10 del mes correspondiente y queda saldo sin recargo. No se aplica solo. No hay campo de comprobante.
**Contexto:** el recargo tiene excepciones que decide quien cobra; aplicarlo automáticamente obligaría a deshacerlo a mano en cada caso especial. El "hoy" del corte se calcula en huso Argentina para que la fecha no corra un día según dónde corra Vercel.
**Estado:** vigente

## Dos transiciones de pago: verificar y anular

**Decisión:** un pago solo tiene dos transiciones: **verificar** (de `pendiente_verificar` a `verificado`) y **anular con motivo**. No existe editar ni rechazar.
**Contexto:** se descartó explícitamente sumar editar y rechazar: la anulación ya resuelve la corrección (se anula y se carga de nuevo) y no justifica un estado nuevo y una migración para llegar al mismo lugar.
**Estado:** vigente

## El historial financiero no se borra

**Decisión:** en `pagos`, `alumna_id` y `registrado_por` son `on delete restrict`; en `asistencia`, los tres FKs también. Borrar una alumna con historial queda bloqueado. Un constraint (`pagos_verificacion_consistente`) garantiza que `verificado_por`, `verificado_en` y `estado='verificado'` vayan siempre juntos.
**Contexto:** perder historial financiero en silencio por un borrado en cascada es peor que un error explícito al intentar borrar. El constraint blinda contra una corrección manual a medio hacer directo en la base, que es la única vía de edición prevista para un pago ya verificado.
**Estado:** vigente

## El recibo se arma recién al verificar

**Decisión:** el texto del recibo (`pagos.recibo_texto`) se genera en el momento de verificar el pago, nunca antes, y queda guardado.
**Contexto:** antes de la verificación el pago todavía puede no existir como tal; un recibo emitido antes sería el comprobante de algo no confirmado. Guardarlo permite reenviarlo después, en vez de que se vea una sola vez.
**Estado:** vigente

## Asistencia sin sábados

**Decisión:** no se toma asistencia los sábados. Está aplicado en tres capas: la UI nunca lista un sábado, la server action lo rechaza, y un CHECK en la base (`asistencia_sin_sabados`) es la red de seguridad. Las planificaciones de sábado (Jungla) siguen funcionando normalmente — el filtro es exclusivo de Asistencia.
**Contexto:** el bloque de sábado de Jungla existe de verdad en `grupo_horarios`, así que una fecha de sábado es fácil de colar pegando la URL. La tercera capa no estaba pedida; se agregó por eso.
**Estado:** vigente

## Presente o ausente, sin tercer estado

**Decisión:** `asistencia.presente` es booleano. No hay estado "justificada". El marcado arranca con nadie tildado y se guarda de a una fecha completa; volver a guardar la misma fecha actualiza en vez de duplicar (unique por alumna + fecha).
**Contexto:** la justificación de ausencias quedó fuera de alcance. Arrancar vacío en vez de con todas presentes obliga a marcar activamente y evita el falso positivo de guardar sin mirar.
**Estado:** vigente

## El grupo del día queda congelado en la fila

**Decisión:** `asistencia.grupo_id` es un snapshot `not null` del grupo en el que estaba la alumna ese día. Nunca se deriva de `alumnas.grupo_id` al leer.
**Contexto:** si una alumna cambia de grupo, su historial de asistencia tiene que seguir mostrando dónde estaba cada día, no reescribirse retroactivamente.
**Estado:** vigente

## La alerta de inasistencias se mide en semanas

**Decisión:** la alerta salta a las **3 semanas calendario consecutivas** (lunes a domingo) sin ningún presente, no a las 3 clases seguidas. La semana en curso no cuenta; una semana solo cuenta si ya tiene asistencia tomada; si la alumna ya vino esta semana, queda fuera de la alerta aunque venga de una racha.
**Contexto:** contar clases daría un umbral distinto por grupo, porque cada uno tiene 2 o 3 días de clase por semana. Las tres reglas de borde van todas hacia el mismo lado, no inventar alertas: los feriados y las semanas sin cargar se saltean sin sumar ni romper la racha, y quien ya volvió no aparece.
**Estado:** vigente

## Torneos cubre solo el registro

**Decisión:** el módulo Torneos registra qué eventos hay y cuándo. Qué alumnas participan tiene el modelo de datos ya creado (`torneo_participantes`) pero todavía **no tiene pantallas**. El control de inscripción paga queda fuera, con su propia definición pendiente.
**Contexto:** alcance recortado a propósito para cerrar Fase 2 con el calendario funcionando, dejando la participación para cuando esté definida.
**Estado:** vigente

## Torneos, exhibiciones y eventos en una sola tabla

**Decisión:** un campo `tipo` (`torneo` / `exhibicion` / `evento`, default `torneo`) distingue los tres, con ícono propio en el listado. No son tablas ni módulos separados.
**Contexto:** de las 7 cosas que el club carga en su calendario, 2 no son torneos de competencia (la Exhibición de Cierre y el último entreno), pero se consultan en el mismo lugar y con la misma lógica de fechas.
**Estado:** vigente

## El estado de un torneo se calcula, no se guarda

**Decisión:** Próximo / En curso / Pasado no es una columna: se calcula en cada lectura comparando las fechas contra hoy.
**Contexto:** una columna de estado exigiría un job que la actualice y podría quedar desfasada. Los pasados se muestran atenuados, no ocultos.
**Estado:** vigente

## Torneos es información de todo el club

**Decisión:** la **lectura** de torneos está abierta a cualquier usuario autenticado, incluidas las alumnas con login (rol Patinador). La **escritura** es solo de Admin y Head Coach. "Torneos" vive en la navegación principal, arriba de Tareas — no dentro de Administración. El próximo evento aparece destacado en el Dashboard para todos los roles.
**Contexto:** es información del calendario del club que le interesa a todo el mundo, no un apartado de gestión interna — misma lógica que Planificaciones. Fue una corrección explícita: el módulo se había construido dentro de Administración y con la lectura acotada a Admin/Head Coach/Secretaria.
**Estado:** vigente

## Un solo criterio de fecha: hoyArgentina()

**Decisión:** todo cálculo de "hoy" en la app usa `hoyArgentina()` (`src/lib/utils/date.ts`), que resuelve la fecha en `America/Argentina/Buenos_Aires`. Ningún módulo calcula la fecha con `new Date().toISOString()`.
**Contexto:** con UTC, entre las 21:00 y la medianoche argentina el servidor ya está en el día siguiente: las clases del día desaparecían del Dashboard cada noche. El helper nació en las reglas de Pagos y se subió a `lib/utils/` para que lo reusen Asistencia, Torneos y el Dashboard.
**Estado:** vigente

## Los reportes se consultan, no avisan

**Decisión:** Deudoras (`/pagos/deudoras`) y Alertas de inasistencia (`/asistencia/alertas`) son pantallas que se consultan. No generan notificaciones ni corren por cron. Deudoras muestra un banner de recordatorio los días 8 y 9 del mes.
**Contexto:** mismo criterio para los dos módulos administrativos: son revisiones periódicas que hace quien administra, no eventos que tengan que interrumpir a alguien. Ver también [Alcance de las notificaciones](#alcance-de-las-notificaciones).
**Estado:** vigente

## Markdown en descripciones y comentarios

**Decisión:** las descripciones de tareas y los comentarios (de tareas y de clases) se renderizan como Markdown, con un componente compartido (`MarkdownText`). Los saltos de línea simples se preservan.
**Contexto:** Luciana arma las planificaciones en ChatGPT y las pega con formato; sin render, los asteriscos y las listas se veían crudos. Se aplicó a las dos vistas de comentarios por consistencia, aunque el caso de uso original era una sola.
**Estado:** vigente
