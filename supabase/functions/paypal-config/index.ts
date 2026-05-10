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

async function credentialsWork(mode: PayPalMode, id: string, secret: string) {
  const auth = btoa(`${id}:${secret}`);
  const r = await fetch(`${PAYPAL_ENDPOINTS[mode]}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  await r.text();
  return r.ok;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const id = Deno.env.get("PAYPAL_CLIENT_ID")?.trim();
    const secret = Deno.env.get("PAYPAL_CLIENT_SECRET")?.trim();
    if (!id || !secret) throw new Error("Missing PayPal credentials");

    const firstMode = preferredMode();
    const mode = await credentialsWork(firstMode, id, secret)
      ? firstMode
      : await credentialsWork(alternateMode(firstMode), id, secret)
        ? alternateMode(firstMode)
        : firstMode;

    return new Response(JSON.stringify({ clientId: id, mode }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});