"use server";

import { createClient } from "@/lib/supabase/server";

export async function marcarNotificacionLeida(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("notificaciones").update({ leida: true }).eq("id", id);
}
