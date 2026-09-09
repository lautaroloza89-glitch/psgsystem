import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { puedeGestionarConvocatoria, puedeVerConvocatoria } from "@/lib/permisos";
import { convocadasDeTorneo, planillaCsv } from "@/lib/torneos/convocatoria";
import { normalizarTexto } from "@/lib/utils/texto";

/**
 * La planilla de convocadas en CSV, para mandarla a la organización del torneo.
 *
 * Va como route handler y no como un blob armado en el cliente para que la
 * descarga pase por el mismo gate que la pantalla: el archivo trae DNI y fecha
 * de nacimiento de menores, así que quién puede bajarlo se decide en el
 * servidor y se vuelve a chequear acá.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const profile = await getCurrentUserProfile();
  if (!puedeVerConvocatoria(profile)) {
    return new NextResponse("No autorizado", { status: 403 });
  }

  const supabase = await createClient();
  const { data: torneo } = await supabase
    .from("torneos")
    .select("nombre, fecha_inicio")
    .eq("id", id)
    .single();

  if (!torneo) {
    return new NextResponse("Torneo no encontrado", { status: 404 });
  }

  const convocadas = await convocadasDeTorneo(supabase, id, puedeGestionarConvocatoria(profile));

  // `Copa González Molina` → `copa-gonzalez-molina-2026-10-04.csv`: sin tildes
  // ni espacios, que es lo que sobrevive a mandarlo por mail o WhatsApp.
  const nombreArchivo = `${normalizarTexto(torneo.nombre)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}-${torneo.fecha_inicio}.csv`;

  return new NextResponse(planillaCsv(convocadas), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
      // Trae datos de menores: que no quede cacheada en ningún lado.
      "Cache-Control": "no-store",
    },
  });
}
