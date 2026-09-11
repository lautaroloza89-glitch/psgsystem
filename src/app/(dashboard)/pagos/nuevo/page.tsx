import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { puedeGestionarPagos } from "@/lib/permisos";
import { BackButton } from "@/components/ui/BackButton";
import {
  RegistrarPagoForm,
  type AlumnaOpcion,
  type ContactoOpcion,
} from "@/components/pagos/RegistrarPagoForm";
import { hoyArgentina } from "@/lib/utils/date";

export const metadata: Metadata = { title: "Registrar pago" };

export default async function NuevoPagoPage({
  searchParams,
}: {
  /** `alumna` y `mes` los pone «Cobrar» desde Deudoras: el formulario abre resuelto. */
  searchParams: Promise<{ alumna?: string; mes?: string }>;
}) {
  const profile = await getCurrentUserProfile();
  if (!puedeGestionarPagos(profile)) {
    redirect("/dashboard");
  }

  const { alumna: alumnaParam, mes: mesParam } = await searchParams;

  const supabase = await createClient();

  const { data: alumnasData } = await supabase
    .from("alumnas")
    .select("id, apellido, nombre, grupo:grupos(nombre)")
    .eq("estado", "activa")
    .not("grupo_id", "is", null)
    .order("apellido", { ascending: true })
    .order("nombre", { ascending: true });

  const alumnas: AlumnaOpcion[] = (alumnasData ?? []).map((a) => ({
    id: a.id,
    apellido: a.apellido,
    nombre: a.nombre,
    grupoNombre: (a.grupo as unknown as { nombre: string } | null)?.nombre ?? "Sin grupo",
  }));

  // «Cobrar» sobre una alumna de baja que quedó debiendo: no está en el
  // listado (el buscador es de activas), así que se la trae aparte. Antes caía
  // en el buscador vacío y no había forma de cobrarle desde Deudores.
  let alumnaInicial = alumnaParam ? alumnas.find((a) => a.id === alumnaParam) ?? null : null;
  if (alumnaParam && !alumnaInicial) {
    const { data: deBaja } = await supabase
      .from("alumnas")
      .select("id, apellido, nombre, grupo:grupos(nombre)")
      .eq("id", alumnaParam)
      .not("grupo_id", "is", null)
      .maybeSingle();

    if (deBaja) {
      alumnaInicial = {
        id: deBaja.id,
        apellido: deBaja.apellido,
        nombre: deBaja.nombre,
        grupoNombre: (deBaja.grupo as unknown as { nombre: string } | null)?.nombre ?? "Sin grupo",
      };
    }
  }

  const alumnaIds = alumnas.map((a) => a.id);
  if (alumnaInicial && !alumnaIds.includes(alumnaInicial.id)) {
    alumnaIds.push(alumnaInicial.id);
  }
  const contactosPorAlumna: Record<string, ContactoOpcion[]> = {};

  if (alumnaIds.length > 0) {
    const { data: contactosData } = await supabase
      .from("contactos")
      .select("id, alumna_id, nombre, es_pagador_principal")
      .in("alumna_id", alumnaIds);

    for (const c of contactosData ?? []) {
      const lista = contactosPorAlumna[c.alumna_id] ?? [];
      lista.push({ id: c.id, nombre: c.nombre, esPagadorPrincipal: c.es_pagador_principal });
      contactosPorAlumna[c.alumna_id] = lista;
    }
  }

  const mesInicial =
    mesParam && /^\d{4}-\d{2}$/.test(mesParam) ? mesParam : hoyArgentina().slice(0, 7);

  const volverA = alumnaParam ? `/pagos/deudoras?mes=${mesInicial}` : `/pagos?mes=${mesInicial}`;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <BackButton href={volverA} />
      <h1 className="text-2xl font-bold tracking-tight">Registrar pago</h1>
      <RegistrarPagoForm
        alumnas={alumnas}
        contactosPorAlumna={contactosPorAlumna}
        alumnaInicial={alumnaInicial}
        mesInicial={mesInicial}
      />
    </div>
  );
}
