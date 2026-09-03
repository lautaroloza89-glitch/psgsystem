import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { BackButton } from "@/components/ui/BackButton";
import { RegistrarPagoForm } from "@/components/pagos/RegistrarPagoForm";

export const metadata: Metadata = { title: "Registrar pago" };

export default async function NuevoPagoPage() {
  const profile = await getCurrentUserProfile();
  if (
    !profile ||
    (profile.rol !== "Admin" && profile.rol !== "Head Coach" && profile.rol !== "Secretaria")
  ) {
    redirect("/dashboard");
  }

  const supabase = await createClient();

  const { data: alumnasData } = await supabase
    .from("alumnas")
    .select("id, apellido, nombre, grupo:grupos(nombre)")
    .eq("estado", "activa")
    .not("grupo_id", "is", null)
    .order("apellido", { ascending: true })
    .order("nombre", { ascending: true });

  const alumnas = (alumnasData ?? []).map((a) => ({
    id: a.id,
    apellido: a.apellido,
    nombre: a.nombre,
    grupoNombre: (a.grupo as unknown as { nombre: string } | null)?.nombre ?? "Sin grupo",
  }));

  const alumnaIds = alumnas.map((a) => a.id);
  const contactosPorAlumna: Record<string, { id: string; nombre: string; esPagadorPrincipal: boolean }[]> = {};

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

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <BackButton href="/pagos" />
      <h1 className="text-2xl font-bold tracking-tight">Registrar pago</h1>
      <RegistrarPagoForm alumnas={alumnas} contactosPorAlumna={contactosPorAlumna} />
    </div>
  );
}
