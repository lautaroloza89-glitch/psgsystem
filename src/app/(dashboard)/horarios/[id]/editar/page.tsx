import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { TurnoForm } from "@/components/horarios/TurnoForm";
import { BackButton } from "@/components/ui/BackButton";
import { editarTurno } from "../../actions";

export const metadata: Metadata = { title: "Editar clase" };

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
    .select(
      "id, fecha, hora_inicio, hora_fin, grupo_id, grupo_legacy, profesores:turno_profesores(profesor_id)"
    )
    .eq("id", id)
    .single();

  if (!turno) {
    notFound();
  }

  const profesoresIdsActuales = (
    turno.profesores as unknown as { profesor_id: string }[]
  ).map((p) => p.profesor_id);

  const puedeEditar =
    !!profile &&
    (profile.rol === "Admin" ||
      profile.rol === "Head Coach" ||
      (profile.rol === "Profesor" && profesoresIdsActuales.includes(profile.id)));

  if (!puedeEditar) {
    redirect(`/horarios/${id}`);
  }

  const { data: usuarios } = await supabase
    .from("users")
    .select("id, nombre, rol, cargo, dicta_clases")
    .order("nombre");

  const profesores = (usuarios ?? []).filter((u) => u.rol === "Profesor" || u.dicta_clases);

  const { data: gruposData } = await supabase
    .from("grupos")
    .select("id, nombre, grupo_horarios(id, dias, hora_inicio, hora_fin)")
    .order("nombre");

  const grupos = (gruposData ?? []).map((g) => ({
    id: g.id,
    nombre: g.nombre,
    bloques: g.grupo_horarios ?? [],
  }));

  // El turno guarda hora_inicio/hora_fin como valores propios (no una FK al
  // bloque), así que para preseleccionar el bloque correcto en el form se
  // busca, dentro de los bloques del grupo ya asignado, el que matchea el
  // horario actual del turno.
  const grupoHorarioIdDefault =
    grupos
      .find((g) => g.id === turno.grupo_id)
      ?.bloques.find(
        (b) => b.hora_inicio === turno.hora_inicio && b.hora_fin === turno.hora_fin
      )?.id ?? "";

  const editarTurnoConId = editarTurno.bind(null, id);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <BackButton href={`/horarios/${id}`} />
      <h1 className="text-2xl font-bold tracking-tight">Editar clase</h1>
      <div className="rounded-xl border border-border bg-surface p-6 shadow-xs sm:p-8">
        <TurnoForm
          action={editarTurnoConId}
          profile={{ id: profile!.id, rol: profile!.rol }}
          profesores={profesores}
          grupos={grupos}
          modo="editar"
          defaultValues={{
            fecha: turno.fecha,
            grupo_id: turno.grupo_id ?? "",
            grupo_horario_id: grupoHorarioIdDefault,
            grupo_legacy: turno.grupo_legacy,
            profesoresIds: profesoresIdsActuales,
          }}
        />
      </div>
    </div>
  );
}
