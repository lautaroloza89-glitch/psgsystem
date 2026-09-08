-- Sistema PSG, Correcciones pre-UI — Bloque 4: campos que faltaban en la base.
--
-- Los cuatro los va a mostrar la UI nueva, así que conviene que existan antes
-- de empezar a escribirla encima.

-- =========================================================
-- 1. Fecha de nacimiento de las alumnas.
--
-- Nullable a propósito: hay 158 fichas ya cargadas sin el dato (el CSV del
-- import no lo traía). Donde falte se muestra vacío, no bloquea nada. Habilita
-- los cumpleaños y es columna obligada de la planilla que se manda a la
-- organización de un torneo, junto al DNI (ver Bloque 5).
-- =========================================================
alter table public.alumnas add column fecha_nacimiento date null;

-- =========================================================
-- 2. Baja lógica del personal.
--
-- Hasta ahora, si alguien se iba del club solo había dos caminos: borrar la
-- fila de `users` (y perder sus tareas y turnos históricos, o chocar contra los
-- FK `on delete restrict`) o dejarla listada como activa para siempre. Mismo
-- criterio que `alumnas.estado`, con los valores en masculino porque acá el
-- listado es de personal mixto.
--
-- No hay pantalla de gestión de usuarios en la app (nadie invita, cambia roles
-- ni da de baja desde la UI), así que por ahora la baja se carga a mano en la
-- base; lo que sí aplica ya es el filtro en los listados y en los selectores de
-- asignación.
-- =========================================================
alter table public.users add column estado text not null default 'activo'
  check (estado in ('activo', 'baja'));

-- =========================================================
-- 3. Recibo de pago guardado.
--
-- El texto para WhatsApp se armaba al verificar, se mostraba una vez en
-- pantalla y se perdía al salir: no había forma de reenviarlo. Se guarda en el
-- pago (uno por pago, siempre el vigente) en vez de en una tabla aparte: no
-- hace falta histórico de envíos para un copiar y pegar.
-- =========================================================
alter table public.pagos add column recibo_texto text null;

-- =========================================================
-- 4. Corrección de pagos: la anulación.
--
-- "Marcar como verificado" era la única transición posible, así que un pago mal
-- cargado solo se podía arreglar a mano en la base. La transición que se agrega
-- es anular con motivo obligatorio: el pago no se edita ni se borra (se
-- conserva el rastro de quién lo cargó), queda como `anulado` y se vuelve a
-- cargar el correcto.
--
-- Los pagos anulados salen solos de todo cálculo de plata: saldo por alumna,
-- deudoras y recaudación ya filtran por estado 'verificado', y la pantalla de
-- pendientes filtra por 'pendiente_verificar'.
-- =========================================================
alter table public.pagos
  add column anulado_por uuid null references public.users(id) on delete set null,
  add column anulado_en timestamptz null,
  add column motivo_anulacion text null;

alter table public.pagos drop constraint pagos_estado_check;
alter table public.pagos add constraint pagos_estado_check
  check (estado in ('pendiente_verificar', 'verificado', 'anulado'));

-- El CHECK de consistencia tenía solo dos ramas y cualquier fila anulada lo
-- violaba. La rama nueva exige los tres campos de la anulación juntos, y no
-- toca `verificado_por`/`verificado_en`: si el pago se anula después de haber
-- sido verificado, se conserva quién lo había verificado.
alter table public.pagos drop constraint pagos_verificacion_consistente;
alter table public.pagos add constraint pagos_verificacion_consistente
  check (
    (estado = 'verificado' and verificado_por is not null and verificado_en is not null)
    or (estado = 'pendiente_verificar' and verificado_por is null and verificado_en is null)
    or (
      estado = 'anulado'
      and anulado_por is not null
      and anulado_en is not null
      and motivo_anulacion is not null
    )
  );
