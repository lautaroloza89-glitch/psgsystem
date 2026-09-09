import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { BackButton } from "@/components/ui/BackButton";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  TomarAsistenciaForm,
  type AlumnaAsistencia,
  type Marca,
} from "@/components/asistencia/TomarAsistenciaForm";
import { guardarAsistencia } from "../../../actions";
import { puedeGestionarAsistencia } from "@/lib/asistencia/permisos";
import { bloqueDelDia, esFechaDeClase } from "@/lib/asistencia/fechas";
import { leerAsistenciaDeAlumnas, leerMarcasDelDia } from "@/lib/asistencia/consultas";
import { SEMANAS_VENTANA } from "@/lib/asistencia/alertas";
import {
  SEMANAS_PARA_AVISO_EN_LISTA,
  agruparPorAlumna,
  rachaDeAlumna,
} from "@/lib/asistencia/rachas";
import {
  diaIsoDeFecha,
  hoyArgentina,
  lunesDeLaSemana,
  nombreDia,
  nombreMes,
  sumarDias,
} from "@/lib/utils/date";

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
    .select("id, nombre, grupo_horarios(dias, hora_inicio, hora_fin)")
    .eq("id", grupoId)
    .single();

  if (!grupo) {
    notFound();
  }

  const horarios = grupo.grupo_horarios ?? [];

  // Los sábados de Jungla quedan afuera acá también, no solo en el listado:
  // pegando la URL a mano tampoco se llega a tomar asistencia de un sábado.
  if (!esFechaDeClase(horarios, fecha)) {
    notFound();
  }

  const bloque = bloqueDelDia(horarios, diaIsoDeFecha(fecha));

  const { data: alumnasData } = await supabase
    .from("alumnas")
    .select("id, apellido, nombre")
    .eq("grupo_id", grupoId)
    .eq("estado", "activa")
    .order("apellido", { ascending: true })
    .order("nombre", { ascending: true });

  const activas = alumnasData ?? [];

  const lunesSemanaActual = lunesDeLaSemana(hoyArgentina());
  const [marcasDelDia, historial] = await Promise.all([
    leerMarcasDelDia(supabase, fecha, grupoId),
    leerAsistenciaDeAlumnas(
      supabase,
      activas.map((a) => a.id),
      sumarDias(lunesSemanaActual, -7 * SEMANAS_VENTANA),
      fecha
    ),
  ]);

  const marcasIniciales: Record<string, Marca> = {};
  for (const marca of marcasDelDia) {
    marcasIniciales[marca.alumna_id] = marca.presente ? "vino" : "falto";
  }

  const porAlumna = agruparPorAlumna(historial);

  const alumnas: AlumnaAsistencia[] = activas.map((alumna) => {
    const racha = rachaDeAlumna(porAlumna.get(alumna.id) ?? [], lunesSemanaActual);
    const avisar =
      !racha.presenteEstaSemana && racha.semanasSinPresente >= SEMANAS_PARA_AVISO_EN_LISTA;

    return {
      id: alumna.id,
      apellido: alumna.apellido,
      nombre: alumna.nombre,
      semanasSinVenir: avisar ? racha.semanasSinPresente : null,
    };
  });

  const [, mes, dia] = fecha.split("-").map(Number);
  const guardar = guardarAsistencia.bind(null, grupoId, fecha);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <BackButton href={`/asistencia?dia=${fecha}`} />

      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{grupo.nombre}</h1>
        <p className="text-sm text-text-subtle">
          {nombreDia(diaIsoDeFecha(fecha))} {dia} de {nombreMes(mes).toLowerCase()}
          {bloque && ` · ${bloque.hora_inicio.slice(0, 5)}`}
        </p>
      </div>

      {alumnas.length === 0 ? (
        <EmptyState mensaje="Este grupo no tiene alumnas activas." />
      ) : (
        <TomarAsistenciaForm
          action={guardar}
          alumnas={alumnas}
          marcasIniciales={marcasIniciales}
        />
      )}
    </div>
  );
}
