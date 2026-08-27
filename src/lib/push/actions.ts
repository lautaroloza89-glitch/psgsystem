"use server";

import { createClient } from "@/lib/supabase/server";

export async function guardarSuscripcionPush(sub: {
  endpoint: string;
  p256dh: string;
  auth: string;
}): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // ignoreDuplicates: si el mismo endpoint ya está guardado (re-suscripción
  // del mismo navegador), no hace falta tocar nada — evita necesitar una
  // política de UPDATE en push_subscriptions solo para este caso.
  await supabase.from("push_subscriptions").upsert(
    { usuario_id: user.id, endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
    { onConflict: "endpoint", ignoreDuplicates: true }
  );
}
