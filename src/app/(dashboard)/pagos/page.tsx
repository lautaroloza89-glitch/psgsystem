import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";

export const metadata: Metadata = { title: "Pagos" };

const SECCIONES = [
  {
    href: "/pagos/nuevo",
    titulo: "Registrar pago",
    descripcion: "Cargar un pago nuevo de una alumna.",
  },
  {
    href: "/pagos/pendientes",
    titulo: "Pendientes de verificar",
    descripcion: "Pagos cargados a la espera de confirmarse contra el MP.",
  },
  {
    href: "/pagos/recaudacion",
    titulo: "Recaudación del mes",
    descripcion: "Total cobrado y verificado, con desglose por método.",
  },
  {
    href: "/pagos/deudoras",
    titulo: "Deudoras",
    descripcion: "Alumnas con saldo pendiente de un mes.",
  },
];

export default async function PagosPage() {
  const profile = await getCurrentUserProfile();
  if (
    !profile ||
    (profile.rol !== "Admin" && profile.rol !== "Head Coach" && profile.rol !== "Secretaria")
  ) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Pagos</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        {SECCIONES.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="block rounded-lg border border-border bg-surface p-5 shadow-xs transition duration-[var(--duration-base)] ease-standard hover:border-border-strong hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            <h2 className="text-lg font-semibold">{s.titulo}</h2>
            <p className="mt-1 text-sm text-text-subtle">{s.descripcion}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
