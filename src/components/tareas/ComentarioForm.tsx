"use client";

import { useActionState, useRef } from "react";
import { agregarComentario, type FormState } from "@/app/(dashboard)/tareas/actions";
import { Spinner } from "@/components/ui/spinner";

const initialState: FormState = { error: null };

export function ComentarioForm({ tareaId }: { tareaId: string }) {
  const agregarComentarioConId = agregarComentario.bind(null, tareaId);
  const [state, formAction, pending] = useActionState(
    agregarComentarioConId,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await formAction(formData);
        formRef.current?.reset();
      }}
      className="space-y-2"
    >
      <textarea
        name="comentario"
        rows={2}
        required
        placeholder="Dejar un comentario..."
        className="w-full rounded-md border border-border-strong px-3 py-2.5 text-sm transition-colors duration-[var(--duration-fast)] ease-standard focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-focus-ring"
      />
      {state.error && <p className="text-sm text-error-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-on-primary transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-primary-600 active:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        {pending && <Spinner />}
        {pending ? "Enviando..." : "Comentar"}
      </button>
    </form>
  );
}
