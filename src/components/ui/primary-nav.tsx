"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ENLACES = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/tareas", label: "Tareas" },
  { href: "/horarios", label: "Horarios" },
];

export function PrimaryNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Principal" className="flex items-center gap-4 text-sm sm:gap-6">
      {ENLACES.map((enlace) => {
        const activo = pathname === enlace.href || pathname.startsWith(`${enlace.href}/`);
        return (
          <Link
            key={enlace.href}
            href={enlace.href}
            aria-current={activo ? "page" : undefined}
            className={`rounded font-medium transition-colors duration-[var(--duration-fast)] ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
              activo ? "text-primary-600" : "text-text-muted hover:text-text"
            }`}
          >
            {enlace.label}
          </Link>
        );
      })}
    </nav>
  );
}
