import webpush from "npm:web-push@3.6.7";

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const PUSH_SHARED_SECRET = Deno.env.get("PUSH_SHARED_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

webpush.setVapidDetails(
  "mailto:lautaroloza89@gmail.com",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

interface PushSubscriptionRow {
  endpoint: string;
  p256dh: string;
  auth: string;
}

Deno.serve(async (req: Request) => {
  if (req.headers.get("x-push-secret") !== PUSH_SHARED_SECRET) {
    return new Response("Forbidden", { status: 403 });
  }

  const { usuario_id, mensaje, tarea_id } = await req.json();

  const subsRes = await fetch(
    `${SUPABASE_URL}/rest/v1/push_subscriptions?usuario_id=eq.${usuario_id}&select=endpoint,p256dh,auth`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  );
  const subs: PushSubscriptionRow[] = await subsRes.json();

  const resultados = await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({ mensaje, tarea_id })
        );
        return { endpoint: sub.endpoint, ok: true };
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        const body = (err as { body?: string }).body;
        const message = (err as { message?: string }).message;

        if (statusCode === 404 || statusCode === 410) {
          await fetch(
            `${SUPABASE_URL}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(sub.endpoint)}`,
            {
              method: "DELETE",
              headers: {
                apikey: SUPABASE_SERVICE_ROLE_KEY,
                Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              },
            }
          );
        }

        return { endpoint: sub.endpoint, ok: false, statusCode, body, message };
      }
    })
  );

  return new Response(JSON.stringify({ enviados: resultados.length, resultados }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
