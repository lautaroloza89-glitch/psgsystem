import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { AlumnaForm } from "@/components/alumnas/AlumnaForm";
import { BackButton } from "@/components/ui/BackButton";
import type { EstadoAlumna } from "@/types";
import { editarAlumna } from "../../actions";

export const metadata: Metadata = { title: "Editar alumna" };

export default async function EditarAlumnaPage({
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
    .select("id, apellido, nombre, dni, fecha_inscripcion, estado, grupo_id")
    .eq("id", id)
    .single();

  if (!alumna) {
    notFound();
  }

  const { data: contactos } = await supabase
    .from("contactos")
    .select("id, nombre, telefono, relacion, es_pagador_principal")
    .eq("alumna_id", id)
    .order("created_at");

  const { data: grupos } = await supabase.from("grupos").select("id, nombre").order("nombre");

  const editarAlumnaConId = editarAlumna.bind(null, id);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <BackButton href={`/alumnas/${id}`} />
      <h1 className="text-2xl font-bold tracking-tight">Editar alumna</h1>
      <div className="rounded-xl border border-border bg-surface p-6 shadow-xs sm:p-8">
        <AlumnaForm
          action={editarAlumnaConId}
          grupos={grupos ?? []}
          modo="editar"
          defaultValues={{
            apellido: alumna.apellido,
            nombre: alumna.nombre,
            dni: alumna.dni,
            fecha_inscripcion: alumna.fecha_inscripcion,
            grupo_id: alumna.grupo_id ?? "",
            estado: alumna.estado as EstadoAlumna,
            contactos: contactos ?? [],
          }}
        />
      </div>
    </div>
  );
}
