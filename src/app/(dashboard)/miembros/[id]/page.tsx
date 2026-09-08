import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { puedeGestionarEquipo, puedeVerFichaMiembro } from "@/lib/permisos";
import { BackButton } from "@/components/ui/BackButton";
import { FichaMiembro } from "@/components/miembros/FichaMiembro";
import { EmailConCopiar } from "@/components/miembros/EmailConCopiar";
import { Icono } from "@/components/ui/Icono";
import {
  enElClubDesde,
  iniciales,
  subtituloMiembro,
  type PerfilDeUsuario,
} from "@/lib/miembros/equipo";
import { hoyArgentina, sumarDias } from "@/lib/utils/date";

export const metadata: Metadata = { title: "Ficha del equipo" };

export default async function MiembroPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const profile = await getCurrentUserProfile();
  if (!puedeVerFichaMiembro(profile)) {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const { data: miembro } = await supabase
    .from("users")
    .select("id, nombre, email, rol, cargo, dicta_clases, created_at")
    .eq("id", id)
    .maybeSingle<PerfilDeUsuario>();

  if (!miembro) notFound();

  const hoy = hoyArgentina();
  const enUnaSemana = sumarDias(hoy, 7);

  // Sus tareas sin cerrar. Hoy, para saber qué tiene encima alguien, hay que ir
  // a Tareas y buscarla a ojo.
  const { data: asignadas } = await supabase
    .from("tarea_asignados")
    .select("tareas!inner(id, estado, fecha_vencimiento)")
    .eq("usuario_id", id);

  const tareas = (asignadas ?? []).flatMap((a) => {
    const t = a.tareas as unknown as { estado: string; fecha_vencimiento: string | null } | null;
    return t && t.estado !== "Completada" ? [t] : [];
  });

  const vencenEstaSemana = tareas.filter(
    (t) => t.fecha_vencimiento && t.fecha_vencimiento <= enUnaSemana
  ).length;

  const editable = puedeGestionarEquipo(profile);

  return (
    <div className="space-y-6">
      <BackButton href="/miembros" />

      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-14 w-14 flex-none items-center justify-center rounded-full bg-primary-50 text-lg font-semibold text-primary-600"
        >
          {iniciales(miembro.nombre)}
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight">{miembro.nombre}</h1>
          <p className="text-sm text-text-subtle">{subtituloMiembro(miembro)}</p>
          <p className="text-sm text-text-subtle">{enElClubDesde(miembro.created_at)}</p>
        </div>
      </div>

      <FichaMiembro
        usuarioId={miembro.id}
        esUnoMismo={miembro.id === profile.id}
        rol={miembro.rol}
        cargo={miembro.cargo}
        dictaClases={miembro.dicta_clases}
        editable={editable}
      />

      <section aria-labelledby="contacto-titulo">
        <h2
          id="contacto-titulo"
          className="px-1 pb-2 text-sm font-semibold uppercase tracking-wide text-text-subtle"
        >
          Contacto
        </h2>
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <EmailConCopiar email={miembro.email} />
        </div>
      </section>

      {tareas.length > 0 && (
        <Link
          href="/tareas"
          className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-primary-50 text-primary-600">
            <Icono nombre="list-checks" className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold leading-snug">
              {tareas.length} {tareas.length === 1 ? "tarea asignada" : "tareas asignadas"}
            </span>
            <span className="block text-sm text-text-subtle">
              {vencenEstaSemana > 0
                ? `${vencenEstaSemana} ${vencenEstaSemana === 1 ? "vence" : "vencen"} esta semana`
                : "Ninguna vence esta semana"}
            </span>
          </span>
          <span aria-hidden="true" className="flex-none text-text-subtle">
            ›
          </span>
        </Link>
      )}
    </div>
  );
}
