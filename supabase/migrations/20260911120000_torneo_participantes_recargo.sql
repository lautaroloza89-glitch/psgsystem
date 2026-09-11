-- Patch post-rediseño (2026-09-11): recargo en la inscripción a un torneo.
--
-- El monto de la inscripción por alumna ya existía (`inscripcion_monto`, Bloque
-- 5): no se agrega una segunda columna. Lo nuevo es marcar si a esa alumna se le
-- cobró el recargo.
--
-- Es un booleano y no un monto: el valor sale de la misma constante que usa
-- Pagos (`RECARGO_MONTO`, lib/pagos/reglas.ts), así que no hay un segundo 10000
-- escrito en Torneos. Igual que en cuotas, el recargo no se aplica solo por
-- fecha: lo marca a mano quien cobra, que es quien sabe si la alumna pagó tarde.
--
-- Aditiva: no toca RLS. La policy de update de `torneo_participantes` (Admin,
-- Head Coach, Secretaria) ya cubre la columna nueva.

alter table public.torneo_participantes
  add column recargo_aplicado boolean not null default false;
