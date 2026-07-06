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
  if (!id || !secret) throw new Error("Missing PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET");
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

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Price and plan are enforced server-side. Never trust client-supplied amounts.
    const requested = await req.json().catch(() => ({}));
    const PLAN_PRICES: Record<string, string> = { pro: "29.00" };
    const plan = typeof requested?.plan === "string" && requested.plan in PLAN_PRICES ? requested.plan : "pro";
    const amount = PLAN_PRICES[plan];

    const { token, base, mode } = await getAccessToken();
    const orderRes = await fetch(`${base}/v2/checkout/orders`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{ amount: { currency_code: "USD", value: amount }, description: `Company Brain ${plan} plan` }],
      }),
    });
    const order = await orderRes.json();
    if (!orderRes.ok) throw new Error(JSON.stringify(order));

    return new Response(JSON.stringify({ orderId: order.id, mode }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("[paypal-create-subscription]", e);
    return new Response(JSON.stringify({ error: "Payment processing failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
