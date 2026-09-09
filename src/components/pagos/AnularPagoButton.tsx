"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { anularPago } from "@/app/(dashboard)/pagos/actions";
import { Spinner } from "@/components/ui/spinner";

export function AnularPagoButton({ pagoId }: { pagoId: string }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleAnular() {
    setError(null);
    startTransition(async () => {
      const result = await anularPago(pagoId, motivo);
      if (result.error) {
        setError(result.error);
        return;
      }
      setAbierto(false);
      setMotivo("");
      // Sin esto el pago anulado se quedaba en pantalla hasta recargar a mano:
      // `revalidatePath` invalida el cache del server, pero no vuelve a pedir
      // la página desde un componente de cliente.
      router.refresh();
    });
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="rounded-md px-3 py-1.5 text-sm font-medium text-error-600 transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-error-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        Anular pago
      </button>
    );
  }

  return (
    <div className="space-y-2 rounded-md border border-error-200 bg-error-50 p-3">
      <label htmlFor={`motivo-${pagoId}`} className="block text-sm font-medium text-error-800">
        ¿Por qué se anula? El pago no se borra: queda registrado como anulado y deja de contar.
      </label>
      <input
        id={`motivo-${pagoId}`}
        type="text"
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        placeholder="Ej: cargado con el monto equivocado"
        className="w-full rounded-md border border-border-strong px-3 py-2 text-sm transition-colors duration-[var(--duration-fast)] ease-standard focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-focus-ring"
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleAnular}
          disabled={pending || !motivo.trim()}
          className="inline-flex items-center gap-2 rounded-md bg-error-600 px-3 py-1.5 text-sm font-medium text-on-primary transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-error-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          {pending && <Spinner className="h-3.5 w-3.5" />}
          Confirmar anulación
        </button>
        <button
          type="button"
          onClick={() => {
            setAbierto(false);
            setError(null);
          }}
          className="rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          Cancelar
        </button>
      </div>
      {error && (
        <p role="alert" aria-live="assertive" className="text-sm text-error-700">
          {error}
        </p>
      )}
    </div>
  );
}
