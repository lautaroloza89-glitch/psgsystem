"use client";

import { useState, useTransition } from "react";
import { borrarTurno } from "@/app/(dashboard)/horarios/actions";

export function BorrarTurnoButton({ turnoId }: { turnoId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("¿Borrar este turno definitivamente? Esta acción no se puede deshacer.")) {
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
        className="rounded-md border border-error-300 px-4 py-2 text-sm font-medium text-error-700 hover:border-error-500 disabled:opacity-50"
      >
        {pending ? "Borrando..." : "Borrar turno"}
      </button>
      {error && <p className="text-sm text-error-600">{error}</p>}
    </div>
  );
}
