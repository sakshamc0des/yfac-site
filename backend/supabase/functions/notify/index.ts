// Sends a web-push notification to every subscriber. Only the admin can call it.
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const url = Deno.env.get("SUPABASE_URL")!;
  const caller = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } });
  const { data: u } = await caller.auth.getUser();
  if (!u?.user) return new Response("unauthorised", { status: 401, headers: cors });
  const db = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: me } = await db.from("profiles").select("role").eq("id", u.user.id).single();
  if (me?.role !== "admin") return new Response("admin only", { status: 403, headers: cors });

  const { title, txt, link } = await req.json();
  webpush.setVapidDetails(Deno.env.get("VAPID_SUBJECT")!, Deno.env.get("VAPID_PUBLIC")!, Deno.env.get("VAPID_PRIVATE")!);
  const { data: subs } = await db.from("push_subscriptions").select("*");
  const payload = JSON.stringify({ title: "YFAC: " + title, body: txt ?? "", url: link || "/" });
  let sent = 0; const dead: string[] = [];
  await Promise.all((subs ?? []).map(async (s) => {
    try { await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload); sent++; }
    catch (e) { if ([404, 410].includes((e as any).statusCode)) dead.push(s.endpoint); }
  }));
  if (dead.length) await db.from("push_subscriptions").delete().in("endpoint", dead);
  return new Response(JSON.stringify({ sent }), { headers: { ...cors, "Content-Type": "application/json" } });
});
