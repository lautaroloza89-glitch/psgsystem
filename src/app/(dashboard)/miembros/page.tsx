import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { puedeVerFichaMiembro, puedeVerModuloMiembros } from "@/lib/permisos";
import { FilaMiembro } from "@/components/miembros/FilaMiembro";
import { agruparPorRol, type MiembroLista } from "@/lib/miembros/equipo";

export const metadata: Metadata = { title: "Equipo" };

export default async function MiembrosPage() {
  const profile = await getCurrentUserProfile();

  if (!puedeVerModuloMiembros(profile)) {
    redirect("/dashboard");
  }

  // El email ya no se pide acá: bajó a la ficha, que es donde se usa. La lista
  // no lo necesita ni siquiera para Admin.
  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("id, nombre, rol, cargo, dicta_clases")
    .eq("estado", "activo")
    .order("nombre");

  const miembros = (data ?? []) as MiembroLista[];
  const grupos = agruparPorRol(miembros);
  const conFicha = puedeVerFichaMiembro(profile);

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Equipo</h1>
          <p className="text-sm text-text-subtle">
            {conFicha
              ? `${miembros.length} ${miembros.length === 1 ? "persona" : "personas"}`
              : "Quién es quién en el club"}
          </p>
        </div>
      </div>

      {/* Sin estado vacío: no puede pasar, siempre estás vos como mínimo. */}
      <div className="space-y-6">
        {grupos.map((grupo) => (
          <section key={grupo.titulo} aria-labelledby={`grupo-${grupo.titulo}`}>
            <h2
              id={`grupo-${grupo.titulo}`}
              className="px-1 pb-2 text-sm font-semibold uppercase tracking-wide text-text-subtle"
            >
              {grupo.titulo}
            </h2>
            <ul className="overflow-hidden rounded-xl border border-border bg-surface divide-y divide-border">
              {grupo.miembros.map((miembro) => (
                <li key={miembro.id}>
                  <FilaMiembro
                    miembro={miembro}
                    esVos={miembro.id === profile.id}
                    href={conFicha ? `/miembros/${miembro.id}` : null}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
