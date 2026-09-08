"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icono } from "@/components/ui/Icono";
import { LogoutButton } from "@/components/ui/logout-button";
import { destinosDelMas, pestanasDeRol } from "@/lib/navegacion";
import type { User } from "@/types";

const CLASE_FOCO =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

function esActivo(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BarraPestanas({ profile }: { profile: User }) {
  const pathname = usePathname();
  const [masAbierto, setMasAbierto] = useState(false);
  const primerEnlaceRef = useRef<HTMLAnchorElement>(null);
  const botonMasRef = useRef<HTMLButtonElement>(null);

  const pestanas = pestanasDeRol(profile);
  const grupos = destinosDelMas(profile);

  useEffect(() => {
    setMasAbierto(false);
  }, [pathname]);

  useEffect(() => {
    if (!masAbierto) return;

    primerEnlaceRef.current?.focus();
    document.body.style.overflow = "hidden";

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMasAbierto(false);
        botonMasRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [masAbierto]);

  // Un destino de «Más» también pinta el botón como activo: si estás en
  // Miembros, la barra tiene que decirte dónde estás en vez de no marcar nada.
  const enMas = grupos.some((g) => g.destinos.some((d) => esActivo(pathname, d.href)));

  return (
    <>
      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]"
      >
        <ul className="mx-auto flex max-w-5xl items-stretch">
          {pestanas.map((destino) => {
            const activo = esActivo(pathname, destino.href);
            return (
              <li key={destino.href} className="flex-1">
                <Link
                  href={destino.href}
                  aria-current={activo ? "page" : undefined}
                  className={`flex flex-col items-center gap-1 px-1 py-2.5 text-xs font-medium transition-colors duration-[var(--duration-fast)] ease-standard ${CLASE_FOCO} ${
                    activo ? "text-primary-600" : "text-text-subtle hover:text-text"
                  }`}
                >
                  <Icono nombre={destino.icono} relleno={activo} className="h-6 w-6" />
                  <span className="max-w-full truncate">{destino.label}</span>
                </Link>
              </li>
            );
          })}

          {grupos.length > 0 && (
            <li className="flex-1">
              <button
                ref={botonMasRef}
                type="button"
                onClick={() => setMasAbierto(true)}
                aria-expanded={masAbierto}
                aria-controls="menu-mas"
                className={`flex w-full flex-col items-center gap-1 px-1 py-2.5 text-xs font-medium transition-colors duration-[var(--duration-fast)] ease-standard ${CLASE_FOCO} ${
                  enMas ? "text-primary-600" : "text-text-subtle hover:text-text"
                }`}
              >
                <Icono nombre="dots" relleno={enMas} className="h-6 w-6" />
                <span>Más</span>
              </button>
            </li>
          )}
        </ul>
      </nav>

      {masAbierto && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Cerrar menú"
            className="absolute inset-0 bg-neutral-900/40"
            onClick={() => setMasAbierto(false)}
          />
          <div
            id="menu-mas"
            role="dialog"
            aria-modal="true"
            aria-label="Más destinos"
            className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-surface p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-xl"
          >
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold tracking-tight">Más</span>
              <button
                type="button"
                onClick={() => setMasAbierto(false)}
                aria-label="Cerrar menú"
                className={`rounded-md p-2 text-xl leading-none text-text-subtle transition-colors duration-[var(--duration-fast)] ease-standard hover:text-text ${CLASE_FOCO}`}
              >
                <span aria-hidden="true">✕</span>
              </button>
            </div>

            {grupos.map((grupo, iGrupo) => (
              <div key={grupo.titulo ?? "general"} className="mt-4">
                {grupo.titulo && (
                  <p className="px-3 pb-1 text-sm font-semibold uppercase tracking-wide text-text-subtle">
                    {grupo.titulo}
                  </p>
                )}
                <ul className="flex flex-col gap-1">
                  {grupo.destinos.map((destino, iDestino) => {
                    const activo = esActivo(pathname, destino.href);
                    return (
                      <li key={destino.href}>
                        <Link
                          ref={
                            iGrupo === 0 && iDestino === 0 ? primerEnlaceRef : undefined
                          }
                          href={destino.href}
                          aria-current={activo ? "page" : undefined}
                          className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-base font-medium transition-colors duration-[var(--duration-fast)] ease-standard ${CLASE_FOCO} ${
                            activo
                              ? "bg-primary-50 text-primary-600"
                              : "text-text hover:bg-surface-muted"
                          }`}
                        >
                          <Icono nombre={destino.icono} className="h-5 w-5 flex-none" />
                          {destino.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}

            <div className="mt-6 border-t border-border pt-4">
              {/* La persona primero y el rol como dato secundario — al revés de
                  `UsuarioRolCargo`, que es lo que se corrige en el módulo 3. */}
              <p className="px-3 text-base font-semibold">{profile.nombre}</p>
              <p className="px-3 text-sm text-text-subtle">
                {profile.cargo ? `${profile.cargo} · ${profile.rol}` : profile.rol}
              </p>
              <LogoutButton
                className={`mt-3 w-full rounded-md px-3 py-2.5 text-left text-base font-medium text-error-600 transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-error-50 ${CLASE_FOCO}`}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
