import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { puedeGestionarConvocatoria, puedeVerConvocatoria } from "@/lib/permisos";
import { convocadasDeTorneo, resumirConvocatoria } from "@/lib/torneos/convocatoria";
import { ListaConvocadas } from "@/components/torneos/ListaConvocadas";
import { BackButton } from "@/components/ui/BackButton";
import { Icono } from "@/components/ui/Icono";

export const metadata: Metadata = { title: "Convocadas" };

export default async function ConvocadasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const profile = await getCurrentUserProfile();
  // Empleado/a y Patinador/a no ven la convocatoria, tampoco pegando la URL:
  // el gate va en el servidor, no solo en el botón.
  if (!puedeVerConvocatoria(profile)) {
    redirect("/torneos");
  }

  const puedeGestionar = puedeGestionarConvocatoria(profile);

  const supabase = await createClient();
  const { data: torneo } = await supabase
    .from("torneos")
    .select("id, nombre")
    .eq("id", id)
    .single();

  if (!torneo) {
    notFound();
  }

  const convocadas = await convocadasDeTorneo(supabase, id, puedeGestionar);
  const resumen = resumirConvocatoria(convocadas);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <BackButton href={`/torneos/${id}`} />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Convocadas · {resumen.convocadas}
          </h1>
          <p className="text-sm text-text-subtle">{torneo.nombre}</p>
        </div>

        {convocadas.length > 0 && (
          // Enlace y no botón: la descarga la sirve una route handler, que
          // vuelve a validar el rol. Un `<a download>` con un blob armado en el
          // cliente se saltearía ese chequeo.
          <a
            href={`/torneos/${id}/planilla`}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md border border-border-strong px-4 text-sm font-medium transition-colors duration-[var(--duration-fast)] ease-standard hover:border-neutral-400 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            <Icono nombre="note" className="h-4 w-4" />
            Descargar planilla
          </a>
        )}
      </div>

      {/* Lo que le falta a la planilla antes de mandarla, dicho antes de
          bajarla y no después. Ninguna de las dos cosas bloquea la descarga. */}
      {convocadas.length > 0 && (resumen.sinFechaNacimiento > 0 || resumen.sinCategoria > 0) && (
        <div className="rounded-xl border border-warning-300 bg-warning-50 px-4 py-3 text-sm text-warning-800">
          <p className="font-medium">Antes de mandar la planilla</p>
          <ul className="mt-1 list-inside list-disc">
            {resumen.sinFechaNacimiento > 0 && (
              <li>
                {resumen.sinFechaNacimiento === 1
                  ? "1 alumna no tiene fecha de nacimiento cargada"
                  : `${resumen.sinFechaNacimiento} alumnas no tienen fecha de nacimiento cargada`}
                . Se cargan desde la ficha de cada una, en Alumnas.
              </li>
            )}
            {resumen.sinCategoria > 0 && (
              <li>
                {resumen.sinCategoria === 1
                  ? "1 alumna no tiene categoría escrita"
                  : `${resumen.sinCategoria} alumnas no tienen categoría escrita`}
                .
              </li>
            )}
          </ul>
        </div>
      )}

      <ListaConvocadas
        torneoId={id}
        convocadas={convocadas}
        puedeGestionar={puedeGestionar}
        verPlata={puedeGestionar}
      />
    </div>
  );
}
