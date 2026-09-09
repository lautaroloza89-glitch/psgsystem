import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { puedeGestionarAlumnas } from "@/lib/permisos";
import { AlumnasListClient, type AlumnaFila } from "@/components/alumnas/AlumnasListClient";
import { rachasParaListado } from "@/lib/alumnas/ficha";
import type { EstadoAlumna } from "@/types";

export const metadata: Metadata = { title: "Alumnas" };

export default async function AlumnasPage() {
  const profile = await getCurrentUserProfile();

  if (!puedeGestionarAlumnas(profile)) {
    redirect("/dashboard");
  }

  const supabase = await createClient();

  const [{ data: alumnasData }, { data: gruposData }, rachas] = await Promise.all([
    supabase
      .from("alumnas")
      .select("id, apellido, nombre, dni, estado, grupo_id, grupo:grupos(nombre)")
      .order("apellido", { ascending: true })
      .order("nombre", { ascending: true }),
    supabase.from("grupos").select("id, nombre").order("nombre"),
    rachasParaListado(supabase),
  ]);

  const alumnas: AlumnaFila[] = (alumnasData ?? []).map((a) => ({
    id: a.id,
    apellido: a.apellido,
    nombre: a.nombre,
    dni: a.dni,
    estado: a.estado as EstadoAlumna,
    grupoId: a.grupo_id,
    grupoNombre: (a.grupo as unknown as { nombre: string } | null)?.nombre ?? "Sin grupo",
    semanasSinVenir: rachas.get(a.id) ?? null,
  }));

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Alumnas</h1>
        <Link
          href="/alumnas/nueva"
          className="shrink-0 rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-on-primary transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-primary-600 active:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          Nueva
        </Link>
      </div>

      <AlumnasListClient alumnas={alumnas} grupos={gruposData ?? []} />
    </div>
  );
}
