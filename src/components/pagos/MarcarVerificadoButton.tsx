"use client";

import { useState, useTransition } from "react";
import { marcarPagoVerificado } from "@/app/(dashboard)/pagos/actions";
import { Spinner } from "@/components/ui/spinner";
import { ReciboAcciones } from "@/components/pagos/ReciboAcciones";

/**
 * «Marcar como verificado» decía qué campo se actualiza. «Está en el MP» dice
 * **qué estás afirmando**: que el dinero apareció en la cuenta. Es el mismo
 * efecto, con el nombre de la acción real.
 */
export function MarcarVerificadoButton({
  pagoId,
  contactoNombre,
  contactoTelefono,
}: {
  pagoId: string;
  contactoNombre: string | null;
  contactoTelefono: string | null;
}) {
  const [verificado, setVerificado] = useState(false);
  const [reciboTexto, setReciboTexto] = useState<string | null>(null);
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

  if (verificado) {
    return (
      <div className="space-y-2 rounded-lg border border-success-200 bg-success-50 p-3">
        <p className="text-sm font-medium text-success-800">✓ Verificado</p>
        {reciboTexto && (
          <ReciboAcciones
            texto={reciboTexto}
            contactoNombre={contactoNombre}
            contactoTelefono={contactoTelefono}
          />
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
        className="flex w-full items-center justify-center gap-2 rounded-md bg-primary-500 px-4 py-2.5 text-sm font-medium text-on-primary transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-primary-600 active:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        {pending && <Spinner />}
        {pending ? "Verificando..." : "Está en el MP"}
      </button>
      {error && (
        <p role="alert" aria-live="assertive" className="text-sm text-error-600">
          {error}
        </p>
      )}
    </div>
  );
}
