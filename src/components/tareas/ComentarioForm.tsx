"use client";

import { useActionState, useRef } from "react";
import { agregarComentario, type FormState } from "@/app/(dashboard)/tareas/actions";

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
        className="w-full rounded border border-black/20 px-3 py-2 text-sm"
      />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Enviando..." : "Comentar"}
      </button>
    </form>
  );
}
