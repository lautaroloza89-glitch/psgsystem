"use client";

import { useMemo, useState } from "react";
import type { EstadoAlumna } from "@/types";
import { AlumnaCard, type AlumnaCardData } from "./AlumnaCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { normalizarTexto } from "@/lib/utils/texto";

const INPUT_CLASS =
  "w-full rounded-md border border-border-strong px-3 py-2.5 text-sm transition-colors duration-[var(--duration-fast)] ease-standard focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-focus-ring";

const TABS_ESTADO: { label: string; value: EstadoAlumna | "Todas" }[] = [
  { label: "Activas", value: "activa" },
  { label: "Bajas", value: "baja" },
  { label: "Todas", value: "Todas" },
];

export function AlumnasListClient({
  alumnas,
  grupos,
}: {
  alumnas: AlumnaCardData[];
  grupos: { id: string; nombre: string }[];
}) {
  const [busqueda, setBusqueda] = useState("");
  const [grupoId, setGrupoId] = useState("");
  const [estado, setEstado] = useState<EstadoAlumna | "Todas">("activa");

  const filtradas = useMemo(() => {
    const busquedaNormalizada = normalizarTexto(busqueda.trim());
    return alumnas
      .filter((a) => estado === "Todas" || a.estado === estado)
      .filter((a) => !grupoId || a.grupoId === grupoId)
      .filter((a) => {
        if (!busquedaNormalizada) return true;
        const campos = [a.apellido, a.nombre, a.dni ?? ""].map(normalizarTexto);
        return campos.some((campo) => campo.includes(busquedaNormalizada));
      });
  }, [alumnas, busqueda, grupoId, estado]);

  if (alumnas.length === 0) {
    return <EmptyState mensaje="Todavía no hay alumnas cargadas." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {TABS_ESTADO.map((tab) => {
          const activo = estado === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setEstado(tab.value)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors duration-[var(--duration-fast)] ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${
                activo
                  ? "border-primary-500 bg-primary-500 text-on-primary hover:bg-primary-600"
                  : "border-border text-text-muted hover:border-neutral-400 hover:bg-surface-muted"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por apellido, nombre o DNI"
          aria-label="Buscar alumna"
          className={INPUT_CLASS}
        />
        <select
          value={grupoId}
          onChange={(e) => setGrupoId(e.target.value)}
          aria-label="Filtrar por grupo"
          className={INPUT_CLASS}
        >
          <option value="">Todos los grupos</option>
          {grupos.map((g) => (
            <option key={g.id} value={g.id}>
              {g.nombre}
            </option>
          ))}
        </select>
      </div>

      <p className="text-sm text-text-subtle">
        Mostrando {filtradas.length} de {alumnas.length}
      </p>

      {filtradas.length === 0 ? (
        <EmptyState mensaje="Ninguna alumna coincide con la búsqueda." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtradas.map((alumna) => (
            <AlumnaCard key={alumna.id} alumna={alumna} />
          ))}
        </div>
      )}
    </div>
  );
}
