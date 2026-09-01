"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatTiempoRelativo } from "@/lib/utils/date";
import type { Notificacion } from "@/types";
import { marcarNotificacionLeida, marcarTodasNotificacionesLeidas } from "./actions";

export function NotificacionesBell({ usuarioId }: { usuarioId: string }) {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  // Contador aparte de la lista: la lista trae solo las últimas 20, el contador
  // cuenta todas las sin leer.
  const [noLeidas, setNoLeidas] = useState(0);
  const [abierto, setAbierto] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    supabase
      .from("notificaciones")
      .select("id, usuario_id, tipo, mensaje, tarea_id, turno_id, leida, creado_en")
      .order("creado_en", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) setNotificaciones(data as Notificacion[]);
      });

    supabase
      .from("notificaciones")
      .select("id", { count: "exact", head: true })
      .eq("leida", false)
      .then(({ count }) => {
        if (typeof count === "number") setNoLeidas(count);
      });

    const channel = supabase
      .channel(`notificaciones-${usuarioId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notificaciones",
          filter: `usuario_id=eq.${usuarioId}`,
        },
        (payload) => {
          const nueva = payload.new as Notificacion;
          setNotificaciones((prev) => [nueva, ...prev]);
          if (!nueva.leida) setNoLeidas((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [usuarioId]);

  async function handleClick(n: Notificacion) {
    setAbierto(false);
    if (!n.leida) {
      setNotificaciones((prev) => prev.map((x) => (x.id === n.id ? { ...x, leida: true } : x)));
      setNoLeidas((prev) => Math.max(0, prev - 1));
      await marcarNotificacionLeida(n.id);
    }
    if (n.tarea_id) {
      router.push(`/tareas/${n.tarea_id}`);
    } else if (n.turno_id) {
      router.push(`/horarios/${n.turno_id}`);
    }
  }

  async function handleMarcarTodas() {
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
    setNoLeidas(0);
    await marcarTodasNotificacionesLeidas();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-haspopup="true"
        aria-label={`Notificaciones${noLeidas > 0 ? `, ${noLeidas} sin leer` : ""}`}
        className="relative rounded-md p-2 text-2xl leading-none text-text transition-colors duration-[var(--duration-fast)] ease-standard hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        <span aria-hidden="true">🔔</span>
        {noLeidas > 0 && (
          <span
            aria-hidden="true"
            className="absolute right-0 top-0 inline-flex min-w-5 items-center justify-center rounded-full bg-error-500 px-1.5 py-0.5 text-xs font-semibold leading-none text-on-primary"
          >
            {noLeidas > 99 ? "99+" : noLeidas}
          </span>
        )}
      </button>

      {abierto && (
        <>
          <button
            type="button"
            aria-label="Cerrar notificaciones"
            className="fixed inset-0 z-40"
            onClick={() => setAbierto(false)}
          />
          <div
            role="dialog"
            aria-label="Notificaciones"
            className="absolute right-0 z-50 mt-2 max-h-96 w-80 max-w-[85vw] overflow-y-auto rounded-lg border border-border bg-surface p-2 shadow-xl"
          >
            {noLeidas > 0 && (
              <div className="flex justify-end border-b border-border px-1 pb-2">
                <button
                  type="button"
                  onClick={handleMarcarTodas}
                  className="rounded px-2 py-1 text-xs font-medium text-primary-600 transition-colors duration-[var(--duration-fast)] ease-standard hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                >
                  Marcar todas como leídas
                </button>
              </div>
            )}

            {notificaciones.length === 0 ? (
              <p className="px-3 py-4 text-sm text-text-subtle">No tenés notificaciones.</p>
            ) : (
              <ul className="mt-1 flex flex-col gap-1">
                {notificaciones.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => handleClick(n)}
                      className={`block w-full rounded-md px-3 py-2 text-left text-sm transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
                        n.leida ? "text-text-subtle" : "font-medium text-text"
                      }`}
                    >
                      <span className="block">{n.mensaje}</span>
                      <span className="mt-0.5 block text-xs text-text-subtle">
                        {formatTiempoRelativo(n.creado_en)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
