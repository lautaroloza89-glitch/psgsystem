import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { puedeCargarPlanificaciones } from "@/lib/permisos";
import { guardarPlanificacion } from "@/app/(dashboard)/horarios/planificaciones-actions";
import { ultimaProfesoraDeFisica } from "@/lib/horarios/dia";
import { PlanificarForm, type GrupoParaPlanificar } from "./PlanificarForm";
import { BackButton } from "@/components/ui/BackButton";
import { anioMesDeHoy, mesQuery, nombreMes } from "@/lib/utils/date";
import type { TipoTurno } from "@/types";
import { redirect } from "next/navigation";

const MES_ISO = /^\d{4}-\d{2}$/;
const FECHA_ISO = /^\d{4}-\d{2}-\d{2}$/;

interface GrupoConHorarios {
  id: string;
  nombre: string;
  grupo_horarios: { dias: number[] }[] | null;
}

/**
 * La pantalla de carga de una planificación, compartida por sus dos entradas.
 *
 * Se entra desde un grupo (`/horarios/grupos/[id]/planificar`, con el chip de
 * grupo ya marcado) o desde la pestaña «Por grupo» (`/horarios/planificar`,
 * sin ninguno marcado). Antes el grupo venía atado a la URL y no se podía
 * cambiar; ahora se elige adentro, con los mismos chips que «Editar clase».
 */
export async function PantallaPlanificar({
  grupoIdInicial = "",
  mesParam,
  fechaParam,
  tipoParam,
  volverA,
}: {
  grupoIdInicial?: string;
  mesParam?: string;
  fechaParam?: string;
  tipoParam?: string;
  volverA: string;
}) {
  const profile = await getCurrentUserProfile();
  if (!puedeCargarPlanificaciones(profile)) {
    redirect(volverA);
  }

  const hoyAM = anioMesDeHoy();
  const [anio, mes] =
    mesParam && MES_ISO.test(mesParam) ? mesParam.split("-").map(Number) : [hoyAM.anio, hoyAM.mes];

  const supabase = await createClient();

  const [{ data: gruposData }, { data: usuarios }] = await Promise.all([
    supabase.from("grupos").select("id, nombre, grupo_horarios(dias)").order("nombre"),
    supabase
      .from("users")
      .select("id, nombre, rol, cargo, dicta_clases")
      .eq("estado", "activo")
      .order("nombre"),
  ]);

  const grupos: GrupoParaPlanificar[] = ((gruposData ?? []) as unknown as GrupoConHorarios[]).map(
    (g) => ({
      id: g.id,
      nombre: g.nombre,
      dias: [...new Set((g.grupo_horarios ?? []).flatMap((b) => b.dias))].sort((a, b) => a - b),
    })
  );

  const profesores = (usuarios ?? []).filter((u) => u.rol === "Profesor" || u.dicta_clases);

  // La fecha del atajo solo vale si cae en el mes que se está cargando; si no,
  // el formulario abriría con una fecha que ni siquiera aparece en la lista.
  const fechaInicial =
    fechaParam && FECHA_ISO.test(fechaParam) && fechaParam.startsWith(mesQuery(anio, mes))
      ? fechaParam
      : undefined;

  const tipoInicial: TipoTurno = tipoParam === "Preparación física" ? tipoParam : "Patín";

  /**
   * Con «+ Agregar Preparación física» se precarga quien viene dando la física
   * de ese grupo, en vez de dejar el nombre escrito en el código: se lee de la
   * última fila cargada, así que el día que cambie la persona se actualiza
   * solo. Igual queda editable.
   */
  const responsablesIniciales =
    tipoInicial === "Preparación física" && grupoIdInicial
      ? await ultimaProfesoraDeFisica(supabase, grupoIdInicial)
      : undefined;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <BackButton href={volverA} />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nueva planificación</h1>
        <p className="text-sm text-text-subtle">
          {grupos.find((g) => g.id === grupoIdInicial)?.nombre ?? "Elegí el grupo"} ·{" "}
          {nombreMes(mes).toLowerCase()}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 shadow-xs sm:p-6">
        {grupos.length === 0 ? (
          <p className="text-sm text-text-subtle">Todavía no hay grupos cargados.</p>
        ) : (
          <PlanificarForm
            action={guardarPlanificacion}
            profile={{ id: profile.id, rol: profile.rol }}
            profesores={profesores}
            grupos={grupos}
            grupoIdInicial={grupoIdInicial}
            anio={anio}
            mes={mes}
            mesLabel={`${nombreMes(mes)} ${anio}`}
            fechaInicial={fechaInicial}
            tipoInicial={tipoInicial}
            responsablesIniciales={responsablesIniciales}
          />
        )}
      </div>
    </div>
  );
}
