import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { FiltroEstadoTabs } from "@/components/tareas/FiltroEstadoTabs";
import { TareaCard, type TareaCardData } from "@/components/tareas/TareaCard";
import type { EstadoTarea } from "@/types";

const ESTADOS_VALIDOS: EstadoTarea[] = ["Pendiente", "En progreso", "Completada"];

export default async function TareasPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const { estado } = await searchParams;
  const filtroEstado = ESTADOS_VALIDOS.includes(estado as EstadoTarea)
    ? (estado as EstadoTarea)
    : null;

  const profile = await getCurrentUserProfile();
  const supabase = await createClient();

  let query = supabase
    .from("tareas")
    .select(
      "id, titulo, estado, fecha_vencimiento, tarea_asignados(usuario_id, users(nombre))"
    )
    .order("fecha_vencimiento", { ascending: true, nullsFirst: false });

  if (filtroEstado) {
    query = query.eq("estado", filtroEstado);
  }

  const { data } = await query;

  const tareas: TareaCardData[] = (data ?? []).map((tarea) => ({
    id: tarea.id,
    titulo: tarea.titulo,
    estado: tarea.estado as EstadoTarea,
    fecha_vencimiento: tarea.fecha_vencimiento,
    asignados: (tarea.tarea_asignados ?? []).flatMap((a) =>
      a.users ? [{ nombre: (a.users as unknown as { nombre: string }).nombre }] : []
    ),
  }));

  const puedeCrear = profile?.rol === "Admin" || profile?.rol === "Profesor";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Tareas</h1>
        {puedeCrear && (
          <Link
            href="/tareas/nueva"
            className="rounded-md bg-primary-500 px-5 py-2.5 text-sm font-medium text-on-primary transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-primary-600 active:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            Nueva tarea
          </Link>
        )}
      </div>

      <FiltroEstadoTabs actual={filtroEstado ?? "Todas"} />

      {tareas.length === 0 ? (
        <p className="text-sm text-text-subtle">No hay tareas para mostrar.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tareas.map((tarea) => (
            <TareaCard key={tarea.id} tarea={tarea} />
          ))}
        </div>
      )}
    </div>
  );
}
