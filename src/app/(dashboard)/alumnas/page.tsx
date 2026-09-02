import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { AlumnasListClient } from "@/components/alumnas/AlumnasListClient";
import type { AlumnaCardData } from "@/components/alumnas/AlumnaCard";
import type { EstadoAlumna } from "@/types";

export const metadata: Metadata = { title: "Alumnas" };

export default async function AlumnasPage() {
  const profile = await getCurrentUserProfile();

  if (
    !profile ||
    (profile.rol !== "Admin" && profile.rol !== "Head Coach" && profile.rol !== "Secretaria")
  ) {
    redirect("/dashboard");
  }

  const supabase = await createClient();

  const [{ data: alumnasData }, { data: gruposData }] = await Promise.all([
    supabase
      .from("alumnas")
      .select("id, apellido, nombre, dni, fecha_inscripcion, estado, grupo_id, grupo:grupos(nombre)")
      .order("apellido", { ascending: true })
      .order("nombre", { ascending: true }),
    supabase.from("grupos").select("id, nombre").order("nombre"),
  ]);

  const alumnas: AlumnaCardData[] = (alumnasData ?? []).map((a) => ({
    id: a.id,
    apellido: a.apellido,
    nombre: a.nombre,
    dni: a.dni,
    fecha_inscripcion: a.fecha_inscripcion,
    estado: a.estado as EstadoAlumna,
    grupoId: a.grupo_id,
    grupoNombre: (a.grupo as unknown as { nombre: string } | null)?.nombre ?? "Sin grupo",
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Alumnas</h1>
        <Link
          href="/alumnas/nueva"
          className="inline-block rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-on-primary transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-primary-600 active:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          Nueva alumna
        </Link>
      </div>

      <AlumnasListClient alumnas={alumnas} grupos={gruposData ?? []} />
    </div>
  );
}
