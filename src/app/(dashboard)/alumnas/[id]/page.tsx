import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { EstadoAlumnaBadge } from "@/components/alumnas/EstadoAlumnaBadge";
import { BackButton } from "@/components/ui/BackButton";
import { formatFecha } from "@/lib/utils/date";
import type { EstadoAlumna } from "@/types";

export const metadata: Metadata = { title: "Detalle de alumna" };

export default async function AlumnaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getCurrentUserProfile();

  if (
    !profile ||
    (profile.rol !== "Admin" && profile.rol !== "Head Coach" && profile.rol !== "Secretaria")
  ) {
    redirect("/dashboard");
  }

  const supabase = await createClient();

  const { data: alumna } = await supabase
    .from("alumnas")
    .select("id, apellido, nombre, dni, fecha_inscripcion, estado, grupo:grupos(nombre)")
    .eq("id", id)
    .single();

  if (!alumna) {
    notFound();
  }

  const { data: contactos } = await supabase
    .from("contactos")
    .select("id, nombre, telefono, relacion, es_pagador_principal")
    .eq("alumna_id", id)
    .order("es_pagador_principal", { ascending: false })
    .order("nombre");

  const grupoNombre =
    (alumna.grupo as unknown as { nombre: string } | null)?.nombre ?? "Sin grupo";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <BackButton href="/alumnas" />

      <div className="space-y-6 rounded-xl border border-border bg-surface p-6 shadow-xs sm:p-8">
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-2xl font-bold tracking-tight">
            {alumna.apellido}, {alumna.nombre}
          </h1>
          <EstadoAlumnaBadge estado={alumna.estado as EstadoAlumna} />
        </div>

        <div className="space-y-1 text-base text-text-muted">
          <p>Grupo: {grupoNombre}</p>
          <p>DNI: {alumna.dni ?? "Sin cargar"}</p>
          <p>Fecha de inscripción: {formatFecha(alumna.fecha_inscripcion)}</p>
        </div>

        <Link
          href={`/alumnas/${alumna.id}/editar`}
          className="inline-block rounded-md border border-border-strong px-4 py-2 text-sm font-medium transition-colors duration-[var(--duration-fast)] ease-standard hover:border-neutral-400 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          Editar
        </Link>
      </div>

      <div className="space-y-4 rounded-xl border border-border bg-surface p-6 shadow-xs sm:p-8">
        <h2 className="text-lg font-semibold">Contactos</h2>
        {contactos && contactos.length > 0 ? (
          <ul className="space-y-3">
            {contactos.map((c) => (
              <li key={c.id} className="rounded-lg border border-border p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{c.nombre}</p>
                  {c.es_pagador_principal && (
                    <span className="inline-block rounded-full bg-primary-50 px-2.5 py-1 text-sm font-medium text-primary-600">
                      Pagador principal
                    </span>
                  )}
                </div>
                <p className="text-sm text-text-subtle">{c.telefono}</p>
                {c.relacion && <p className="text-sm text-text-subtle">{c.relacion}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-text-subtle">Todavía no hay contactos cargados.</p>
        )}
      </div>
    </div>
  );
}
