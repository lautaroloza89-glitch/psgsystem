"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const DEFAULT_CLASS =
  "rounded text-sm font-medium text-text-muted transition-colors duration-[var(--duration-fast)] ease-standard hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button onClick={handleLogout} className={className ?? DEFAULT_CLASS}>
      Cerrar sesión
    </button>
  );
}
