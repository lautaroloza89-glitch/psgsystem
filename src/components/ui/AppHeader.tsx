"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LogoutButton } from "@/components/ui/logout-button";
import { UsuarioRolCargo } from "@/components/ui/UsuarioRolCargo";
import type { User } from "@/types";

const ENLACES = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/tareas", label: "Tareas" },
  { href: "/horarios", label: "Clases / Turnos" },
  { href: "/miembros", label: "Miembros del equipo" },
];

export function AppHeader({ profile }: { profile: User }) {
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(false);
  const primerEnlaceRef = useRef<HTMLAnchorElement>(null);
  const botonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setAbierto(false);
  }, [pathname]);

  useEffect(() => {
    if (!abierto) return;

    primerEnlaceRef.current?.focus();
    document.body.style.overflow = "hidden";

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setAbierto(false);
        botonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [abierto]);

  return (
    <>
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl items-center px-4 py-3 sm:px-8">
          <button
            ref={botonRef}
            type="button"
            onClick={() => setAbierto(true)}
            aria-expanded={abierto}
            aria-controls="menu-principal"
            aria-label="Abrir menú"
            className="rounded-md p-2 text-2xl leading-none text-text transition-colors duration-[var(--duration-fast)] ease-standard hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            <span aria-hidden="true">☰</span>
          </button>
        </div>
      </header>

      {abierto && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Cerrar menú"
            className="absolute inset-0 bg-neutral-900/40"
            onClick={() => setAbierto(false)}
          />
          <div
            id="menu-principal"
            role="dialog"
            aria-modal="true"
            aria-label="Menú principal"
            className="absolute left-0 top-0 flex h-full w-72 max-w-[85vw] flex-col bg-surface p-4 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold tracking-tight">Patín Saint Germain</span>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                aria-label="Cerrar menú"
                className="rounded-md p-2 text-xl leading-none text-text-subtle transition-colors duration-[var(--duration-fast)] ease-standard hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              >
                <span aria-hidden="true">✕</span>
              </button>
            </div>

            <nav aria-label="Principal" className="mt-6 flex flex-1 flex-col gap-1">
              {ENLACES.map((enlace, i) => {
                const activo =
                  pathname === enlace.href || pathname.startsWith(`${enlace.href}/`);
                return (
                  <Link
                    key={enlace.href}
                    ref={i === 0 ? primerEnlaceRef : undefined}
                    href={enlace.href}
                    aria-current={activo ? "page" : undefined}
                    className={`rounded-md px-3 py-2.5 text-base font-medium transition-colors duration-[var(--duration-fast)] ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
                      activo
                        ? "bg-primary-50 text-primary-600"
                        : "text-text hover:bg-surface-muted"
                    }`}
                  >
                    {enlace.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto">
              <div className="px-3 pb-4">
                <UsuarioRolCargo nombre={profile.nombre} rol={profile.rol} cargo={profile.cargo} />
              </div>
              <div className="border-t border-border pt-4">
                <LogoutButton className="w-full rounded-md px-3 py-2.5 text-left text-base font-medium text-error-600 transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-error-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface" />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
