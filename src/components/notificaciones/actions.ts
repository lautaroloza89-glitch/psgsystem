"use server";

import { createClient } from "@/lib/supabase/server";

export async function marcarNotificacionLeida(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("notificaciones").update({ leida: true }).eq("id", id);
}

export async function marcarTodasNotificacionesLeidas(): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("notificaciones")
    .update({ leida: true })
    .eq("usuario_id", user.id)
    .eq("leida", false);
}
