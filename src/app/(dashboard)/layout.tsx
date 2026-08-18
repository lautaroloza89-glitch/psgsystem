import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { LogoutButton } from "@/components/ui/logout-button";

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
      <header className="flex items-center justify-between border-b border-black/10 px-4 py-3">
        <div className="text-sm">
          <span className="font-medium">{profile.nombre}</span>
          <span className="ml-2 text-black/50">{profile.rol}</span>
        </div>
        <LogoutButton />
      </header>
      <main className="p-4">{children}</main>
    </div>
  );
}
