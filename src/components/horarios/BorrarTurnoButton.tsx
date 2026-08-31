"use client";

import { useState, useTransition } from "react";
import { borrarTurno } from "@/app/(dashboard)/horarios/actions";
import { Spinner } from "@/components/ui/spinner";

export function BorrarTurnoButton({ turnoId }: { turnoId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("¿Borrar esta clase definitivamente? Esta acción no se puede deshacer.")) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await borrarTurno(turnoId);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-md border border-error-300 px-4 py-2 text-sm font-medium text-error-700 transition-colors duration-[var(--duration-fast)] ease-standard hover:border-error-500 hover:bg-error-50 active:bg-error-100 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        {pending && <Spinner className="h-4 w-4" />}
        {pending ? "Borrando..." : "Borrar clase"}
      </button>
      {error && (
        <p role="alert" aria-live="assertive" className="text-sm text-error-600">
          {error}
        </p>
      )}
    </div>
  );
}
