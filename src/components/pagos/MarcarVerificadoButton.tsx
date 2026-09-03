"use client";

import { useState, useTransition } from "react";
import { marcarPagoVerificado } from "@/app/(dashboard)/pagos/actions";
import { Spinner } from "@/components/ui/spinner";

export function MarcarVerificadoButton({ pagoId }: { pagoId: string }) {
  const [verificado, setVerificado] = useState(false);
  const [reciboTexto, setReciboTexto] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await marcarPagoVerificado(pagoId);
      if (result.error) {
        setError(result.error);
      } else {
        setVerificado(true);
        setReciboTexto(result.reciboTexto ?? null);
      }
    });
  }

  async function copiarRecibo() {
    if (!reciboTexto) return;
    await navigator.clipboard.writeText(reciboTexto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  if (verificado) {
    return (
      <div className="space-y-2 rounded-md border border-success-200 bg-success-50 p-3">
        <p className="text-sm font-medium text-success-800">✓ Verificado</p>
        {reciboTexto && (
          <>
            <pre className="whitespace-pre-wrap rounded-md bg-surface p-3 text-sm text-text">
              {reciboTexto}
            </pre>
            <button
              type="button"
              onClick={copiarRecibo}
              className="rounded-md border border-border-strong px-3 py-1.5 text-sm font-medium transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              {copiado ? "Copiado ✓" : "Copiar recibo"}
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="flex items-center gap-2 rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-on-primary transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-primary-600 active:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        {pending && <Spinner />}
        {pending ? "Verificando..." : "Marcar como verificado"}
      </button>
      {error && (
        <p role="alert" aria-live="assertive" className="text-sm text-error-600">
          {error}
        </p>
      )}
    </div>
  );
}
