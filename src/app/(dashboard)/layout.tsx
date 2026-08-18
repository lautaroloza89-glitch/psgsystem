import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { LogoutButton } from "@/components/ui/logout-button";
import { PrimaryNav } from "@/components/ui/primary-nav";

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
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-8">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <Link
              href="/dashboard"
              className="rounded text-sm font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              Escuela de Patín
            </Link>
            <PrimaryNav />
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="font-medium">{profile.nombre}</span>
              <span className="ml-2 text-text-subtle">{profile.rol}</span>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main id="main-content" className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-10">
        {children}
      </main>
    </div>
  );
}
