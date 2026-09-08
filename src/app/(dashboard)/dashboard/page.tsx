import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { BloqueAvisos } from "@/components/dashboard/BloqueAvisos";
import { BloqueClasesHoy } from "@/components/dashboard/BloqueClasesHoy";
import { TorneoLinea } from "@/components/torneos/TorneoLinea";
import { Icono } from "@/components/ui/Icono";
import { datosDelInicio } from "@/lib/dashboard/inicio";
import { hoyArgentina } from "@/lib/utils/date";
import { puedeGestionarAsistencia } from "@/lib/asistencia/permisos";

export const metadata: Metadata = { title: "Inicio" };

export default async function InicioPage() {
  const profile = await getCurrentUserProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();
  const hoy = hoyArgentina();

  const [datos, { data: torneo }] = await Promise.all([
    datosDelInicio(supabase, profile),
    // El próximo evento es de todo el club: misma lectura abierta que /torneos.
    supabase
      .from("torneos")
      .select("id, nombre, tipo, lugar, fecha_inicio, fecha_fin")
      .gte("fecha_fin", hoy)
      .order("fecha_inicio", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  // El atajo «Tomar asistencia» del modelo se muestra solo a quien de verdad
  // puede cargarla: hoy Profesor no está en `puedeGestionarAsistencia`, y un
  // botón que redirige a /dashboard es peor que no tenerlo. Si más adelante se
  // decide sumarlo, aparece solo. Ver docs/pendientes.md.
  const conAccionAsistencia = puedeGestionarAsistencia(profile.rol);

  // El saludo y la fecha viven en el header, que ya los muestra en todas las
  // pantallas: acá no se repiten.
  const nadaQueAtender =
    datos.avisos.length === 0 && !datos.clases && datos.accesos.length === 0;

  return (
    <div className="space-y-6">
      <h1 className="sr-only">Inicio</h1>

      {datos.avisos.length > 0 && (
        <BloqueAvisos titulo={datos.tituloAvisos} avisos={datos.avisos} />
      )}

      {datos.accesos.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {datos.accesos.map((acceso) => (
            <Link
              key={acceso.href}
              href={acceso.href}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary-500 px-4 py-3 text-sm font-medium text-on-primary transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              <Icono nombre={acceso.icono} className="h-5 w-5" />
              {acceso.label}
            </Link>
          ))}
        </div>
      )}

      {datos.clases && (
        <BloqueClasesHoy
          titulo={datos.clases.titulo}
          verTodas={datos.clases.verTodas}
          clases={datos.clases.items}
          conAccionAsistencia={conAccionAsistencia}
        />
      )}

      {/* Un solo mensaje cuando no hay nada que atender, en vez de dos cajas
          vacías («No hay tareas pendientes.» / «No hay clases próximas.»). */}
      {nadaQueAtender && (
        <div className="rounded-xl border border-border bg-surface px-4 py-8 text-center">
          <p className="font-semibold">Todo al día</p>
          <p className="mt-1 text-sm text-text-subtle">
            {profile.rol === "Patinador"
              ? "Acá vas a ver tus clases y el estado de tu cuota."
              : "No hay nada pendiente para vos por ahora."}
          </p>
        </div>
      )}

      {torneo && <TorneoLinea torneo={torneo} hoy={hoy} />}
    </div>
  );
}
