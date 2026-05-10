import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PAYPAL_ENDPOINTS = {
  sandbox: "https://api-m.sandbox.paypal.com",
  live: "https://api-m.paypal.com",
} as const;

type PayPalMode = keyof typeof PAYPAL_ENDPOINTS;

const preferredMode = (): PayPalMode =>
  (Deno.env.get("PAYPAL_MODE") ?? "sandbox").toLowerCase() === "live" ? "live" : "sandbox";

const alternateMode = (mode: PayPalMode): PayPalMode => (mode === "live" ? "sandbox" : "live");

async function requestAccessToken(mode: PayPalMode, id: string, secret: string) {
  const auth = btoa(`${id}:${secret}`);
  const base = PAYPAL_ENDPOINTS[mode];
  const r = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  const j = await r.json();
  return { ok: r.ok, token: j.access_token as string | undefined, error: j, base, mode };
}

async function getAccessToken() {
  const id = Deno.env.get("PAYPAL_CLIENT_ID")?.trim();
  const secret = Deno.env.get("PAYPAL_CLIENT_SECRET")?.trim();
  if (!id || !secret) throw new Error("Missing PayPal credentials");
  const firstMode = preferredMode();
  const first = await requestAccessToken(firstMode, id, secret);
  if (first.ok && first.token) return { token: first.token, base: first.base, mode: first.mode };

  if (first.error?.error === "invalid_client") {
    const second = await requestAccessToken(alternateMode(firstMode), id, secret);
    if (second.ok && second.token) return { token: second.token, base: second.base, mode: second.mode };
    throw new Error(`PayPal token failed for ${firstMode} and ${second.mode}: ${JSON.stringify(second.error)}`);
  }

  throw new Error(`PayPal token (${first.base}): ${JSON.stringify(first.error)}`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { orderId, plan = "pro" } = await req.json();
    if (!orderId) throw new Error("Missing orderId");

    const { token, base } = await getAccessToken();
    const capRes = await fetch(`${base}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    const cap = await capRes.json();
    if (!capRes.ok || cap.status !== "COMPLETED") throw new Error(JSON.stringify(cap));

    // Update subscription using service role
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: prof } = await admin.from("profiles").select("company_id").eq("id", user.id).maybeSingle();
    if (prof?.company_id) {
      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + 1);
      await admin.from("subscriptions").update({
        status: "active",
        plan,
        paypal_subscription_id: cap.id,
        current_period_end: periodEnd.toISOString(),
      }).eq("company_id", prof.company_id);
    }

    return new Response(JSON.stringify({ success: true, capture: cap }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
