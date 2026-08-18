import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { TurnoForm } from "@/components/horarios/TurnoForm";
import { editarTurno } from "../../actions";

export const metadata: Metadata = { title: "Editar turno" };

export default async function EditarTurnoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getCurrentUserProfile();
  const supabase = await createClient();

  const { data: turno } = await supabase
    .from("turnos")
    .select("id, fecha, hora_inicio, hora_fin, grupo_nivel, capacidad, profesor_id")
    .eq("id", id)
    .single();

  if (!turno) {
    notFound();
  }

  const puedeEditar =
    !!profile &&
    (profile.rol === "Admin" ||
      (profile.rol === "Profesor" && turno.profesor_id === profile.id));

  if (!puedeEditar) {
    redirect(`/horarios/${id}`);
  }

  const { data: usuarios } = await supabase
    .from("users")
    .select("id, nombre, rol, dicta_clases")
    .order("nombre");

  const profesores = (usuarios ?? []).filter((u) => u.rol === "Profesor" || u.dicta_clases);

  const editarTurnoConId = editarTurno.bind(null, id);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Link
          href={`/horarios/${id}`}
          className="rounded text-sm text-text-subtle transition-colors duration-[var(--duration-fast)] ease-standard hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          ← Volver
        </Link>
      </div>
      <h1 className="text-2xl font-bold tracking-tight">Editar turno</h1>
      <div className="rounded-xl border border-border bg-surface p-6 shadow-xs sm:p-8">
        <TurnoForm
          action={editarTurnoConId}
          profile={{ id: profile!.id, rol: profile!.rol }}
          profesores={profesores}
          modo="editar"
          defaultValues={{
            fecha: turno.fecha,
            hora_inicio: turno.hora_inicio.slice(0, 5),
            hora_fin: turno.hora_fin.slice(0, 5),
            grupo_nivel: turno.grupo_nivel,
            capacidad: String(turno.capacidad),
            profesor_id: turno.profesor_id ?? "",
          }}
        />
      </div>
    </div>
  );
}
