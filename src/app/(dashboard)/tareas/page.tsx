import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import {
  puedeCambiarEstadoTarea,
  puedeCrearTarea,
  puedeVerModuloTareas,
} from "@/lib/permisos";
import { PestanasTareas } from "@/components/tareas/PestanasTareas";
import { FilaTarea } from "@/components/tareas/FilaTarea";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icono } from "@/components/ui/Icono";
import {
  MENSAJE_VACIO,
  agruparPorUrgencia,
  nombreDePila,
  pestanasDeVista,
  vistaValida,
  type TareaEnLista,
} from "@/lib/tareas/agenda";
import { hoyArgentina } from "@/lib/utils/date";
import type { EstadoTarea } from "@/types";

export const metadata: Metadata = { title: "Tareas" };

export default async function TareasPage({
  searchParams,
}: {
  searchParams: Promise<{ ver?: string }>;
}) {
  const { ver } = await searchParams;
  const profile = await getCurrentUserProfile();

  if (!puedeVerModuloTareas(profile)) {
    redirect("/dashboard");
  }

  const esDeGestion =
    profile.rol === "Admin" || profile.rol === "Head Coach" || profile.rol === "Secretaria";
  const vista = vistaValida(ver, esDeGestion);
  const hoy = hoyArgentina();

  const supabase = await createClient();
  const { data } = await supabase
    .from("tareas")
    .select(
      "id, titulo, estado, fecha_vencimiento, created_by, autor:created_by(nombre), tarea_asignados(usuario_id, users(nombre))"
    )
    .order("fecha_vencimiento", { ascending: true, nullsFirst: false });

  const todas: TareaEnLista[] = (data ?? []).map((t) => {
    const asignados = t.tarea_asignados ?? [];
    return {
      id: t.id,
      titulo: t.titulo,
      estado: t.estado as EstadoTarea,
      fecha_vencimiento: t.fecha_vencimiento,
      responsables: asignados.flatMap((a) => {
        const u = a.users as unknown as { nombre: string } | null;
        return u ? [nombreDePila(u.nombre)] : [];
      }),
      asignadaPor: (() => {
        const autor = t.autor as unknown as { nombre: string } | null;
        // «Te la asignó Luciana» pierde sentido si te la asignaste vos.
        return autor && t.created_by !== profile.id ? nombreDePila(autor.nombre) : null;
      })(),
      esMia: asignados.some((a) => a.usuario_id === profile.id),
      createdBy: t.created_by,
      asignadosIds: asignados.map((a) => a.usuario_id),
    };
  });

  const abiertas = todas.filter((t) => t.estado !== "Completada");
  const mias = abiertas.filter((t) => t.esMia);

  const visibles =
    vista === "hechas"
      ? todas.filter((t) => t.estado === "Completada")
      : vista === "mias"
        ? mias
        : vista === "todas"
          ? abiertas
          : abiertas;

  const grupos = agruparPorUrgencia(visibles, hoy);
  const puedeCrear = puedeCrearTarea(profile);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Tareas</h1>
        {puedeCrear && (
          <Link
            href="/tareas/nueva"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary-500 px-4 py-2.5 text-sm font-medium text-on-primary transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            <span aria-hidden="true">+</span>
            Nueva
          </Link>
        )}
      </div>

      <PestanasTareas
        pestanas={pestanasDeVista(esDeGestion)}
        actual={vista}
        conteos={{ abiertas: abiertas.length, todas: abiertas.length, mias: mias.length }}
      />

      {visibles.length === 0 ? (
        <EmptyState mensaje={MENSAJE_VACIO[vista]} />
      ) : (
        <div className="space-y-5">
          {grupos.map((grupo) => (
            <section key={grupo.clave} aria-labelledby={`grupo-${grupo.clave}`}>
              <h2
                id={`grupo-${grupo.clave}`}
                className={`px-1 pb-2 text-sm font-semibold uppercase tracking-wide ${
                  grupo.clave === "vencidas" ? "text-error-600" : "text-text-subtle"
                }`}
              >
                {grupo.titulo}
              </h2>
              <ul className="overflow-hidden rounded-xl border border-border bg-surface divide-y divide-border">
                {grupo.tareas.map((tarea) => (
                  <li key={tarea.id}>
                    <FilaTarea
                      tarea={tarea}
                      hoy={hoy}
                      vencida={grupo.clave === "vencidas"}
                      // El atajo solo en las propias, y solo si el servidor la
                      // va a dejar pasar: el mismo helper que valida la action,
                      // con los datos reales de la tarea.
                      conAcciones={
                        tarea.esMia &&
                        puedeCambiarEstadoTarea(profile, {
                          created_by: tarea.createdBy,
                          tarea_asignados: tarea.asignadosIds.map((usuario_id) => ({
                            usuario_id,
                          })),
                        })
                      }
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {vista === "mias" && visibles.length > 0 && !esDeGestion && (
        <p className="px-1 text-sm text-text-subtle">
          <Icono nombre="list-checks" className="mr-1 inline h-4 w-4 align-text-bottom" />
          En «Todas» ves las del resto del equipo.
        </p>
      )}
    </div>
  );
}
