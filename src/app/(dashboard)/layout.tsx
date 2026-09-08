import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { AppHeader } from "@/components/ui/AppHeader";
import { BarraPestanas } from "@/components/ui/BarraPestanas";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen">
      <a
        href="#main-content"
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:left-4 focus-visible:top-4 focus-visible:z-50 focus-visible:rounded-md focus-visible:bg-primary-500 focus-visible:px-4 focus-visible:py-2 focus-visible:text-sm focus-visible:font-medium focus-visible:text-on-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2"
      >
        Saltar al contenido principal
      </a>
      <AppHeader profile={profile} />
      {/* El padding de abajo deja libre la altura de la barra fija (y el área
          segura del iPhone), para que el último elemento de cualquier pantalla
          no quede tapado. */}
      <main
        id="main-content"
        className="mx-auto max-w-5xl px-4 py-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:px-8 sm:py-10 sm:pb-[calc(6rem+env(safe-area-inset-bottom))]"
      >
        {children}
      </main>
      <BarraPestanas profile={profile} />
    </div>
  );
}
