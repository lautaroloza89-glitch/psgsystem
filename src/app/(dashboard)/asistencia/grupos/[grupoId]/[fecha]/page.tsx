import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { BackButton } from "@/components/ui/BackButton";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  TomarAsistenciaForm,
  type AlumnaAsistencia,
} from "@/components/asistencia/TomarAsistenciaForm";
import { guardarAsistencia } from "../../../actions";
import { puedeGestionarAsistencia } from "@/lib/asistencia/permisos";
import { esFechaDeClase } from "@/lib/asistencia/fechas";
import { diaIsoDeFecha, formatFecha, mesQuery, nombreDia } from "@/lib/utils/date";

export const metadata: Metadata = { title: "Tomar asistencia" };

export default async function TomarAsistenciaPage({
  params,
}: {
  params: Promise<{ grupoId: string; fecha: string }>;
}) {
  const profile = await getCurrentUserProfile();
  if (!profile || !puedeGestionarAsistencia(profile.rol)) {
    redirect("/dashboard");
  }

  const { grupoId, fecha } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    notFound();
  }

  const supabase = await createClient();
  const { data: grupo } = await supabase
    .from("grupos")
    .select("id, nombre, grupo_horarios(dias)")
    .eq("id", grupoId)
    .single();

  if (!grupo) {
    notFound();
  }

  // Los sábados de Jungla quedan afuera acá también, no solo en el listado:
  // pegando la URL a mano tampoco se llega a tomar asistencia de un sábado.
  if (!esFechaDeClase(grupo.grupo_horarios ?? [], fecha)) {
    notFound();
  }

  const [anio, mes] = fecha.split("-").map(Number);
  const volverA = `/asistencia/grupos/${grupoId}?mes=${mesQuery(anio, mes)}`;

  const [{ data: alumnasData }, { data: asistenciaData }] = await Promise.all([
    supabase
      .from("alumnas")
      .select("id, apellido, nombre")
      .eq("grupo_id", grupoId)
      .eq("estado", "activa")
      .order("apellido", { ascending: true })
      .order("nombre", { ascending: true }),
    supabase.from("asistencia").select("alumna_id, presente").eq("fecha", fecha).eq("grupo_id", grupoId),
  ]);

  const alumnas: AlumnaAsistencia[] = alumnasData ?? [];
  const presentesIniciales = (asistenciaData ?? [])
    .filter((a) => a.presente)
    .map((a) => a.alumna_id);
  const yaCargada = (asistenciaData ?? []).length > 0;

  const guardar = guardarAsistencia.bind(null, grupoId, fecha);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <BackButton href={volverA} />

      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">
          {nombreDia(diaIsoDeFecha(fecha))} {formatFecha(fecha)}
        </h1>
        <p className="text-sm text-text-subtle">{grupo.nombre}</p>
      </div>

      {alumnas.length === 0 ? (
        <EmptyState mensaje="Este grupo no tiene alumnas activas." />
      ) : (
        <>
          <p className="text-sm text-text-subtle">
            {yaCargada
              ? "Esta fecha ya tiene asistencia cargada. Podés corregirla y volver a guardar."
              : "Tildá a las alumnas presentes. Las que queden sin tildar se guardan como ausentes."}
          </p>
          <TomarAsistenciaForm
            action={guardar}
            alumnas={alumnas}
            presentesIniciales={presentesIniciales}
          />
        </>
      )}
    </div>
  );
}
