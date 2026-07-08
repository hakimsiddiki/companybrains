import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const NO_INFO =
  "I don't have that information in company data. Please upload relevant documents first to get answers.";
const MAX_CONTEXT_CHARS = 250_000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }
    const token = authHeader.replace("Bearer ", "");

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    const user = userData?.user;
    if (userErr || !user) return json({ error: "Unauthorized" }, 401);

    const { question } = await req.json();
    if (!question || typeof question !== "string") {
      return json({ error: "question is required" }, 400);
    }
    const MAX_QUESTION_CHARS = 2000;
    if (question.trim().length === 0 || question.length > MAX_QUESTION_CHARS) {
      return json({ error: "Question must be between 1 and 2000 characters." }, 400);
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .maybeSingle();
    const companyId = profile?.company_id;
    if (!companyId) return json({ answer: NO_INFO, sources: [] });

    const { data: docs } = await admin
      .from("documents")
      .select("name, content")
      .eq("company_id", companyId)
      .eq("status", "ready")
      .not("content", "is", null);

    const usable = (docs ?? []).filter((d) => (d.content ?? "").trim().length > 0);
    if (usable.length === 0) {
      return json({ answer: NO_INFO, sources: [] });
    }

    let context = "";
    const sources: { title: string; excerpt: string }[] = [];
    for (const d of usable) {
      if (context.length >= MAX_CONTEXT_CHARS) break;
      const remaining = MAX_CONTEXT_CHARS - context.length;
      const snippet = (d.content ?? "").slice(0, remaining);
      context += `\n\n===== DOCUMENT: ${d.name} =====\n${snippet}`;
      sources.push({ title: d.name, excerpt: (d.content ?? "").trim().slice(0, 160) });
    }

    const systemPrompt =
      "You are the Company Brain assistant. Answer ONLY using the provided company documents below. " +
      "Do NOT use outside or general knowledge. If the answer is not contained in the documents, reply with EXACTLY this sentence and nothing else: " +
      `"${NO_INFO}" ` +
      "Be concise and cite the document name(s) you used when relevant.\n\n" +
      "===== COMPANY DOCUMENTS =====" +
      context;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "AI not configured" }, 500);

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question },
        ],
      }),
    });

    if (aiResp.status === 429) {
      return json({ error: "Rate limit exceeded, please try again shortly." }, 429);
    }
    if (aiResp.status === 402) {
      return json({ error: "AI credits exhausted. Please add credits to continue." }, 402);
    }
    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error("[chat] AI gateway error", aiResp.status, errText);
      return json({ error: "AI request failed" }, 500);
    }

    const aiData = await aiResp.json();
    const answer: string = aiData?.choices?.[0]?.message?.content?.trim() || NO_INFO;

    const usedSources = answer === NO_INFO ? [] : sources;
    return json({ answer, sources: usedSources });
  } catch (e) {
    console.error("[chat]", e);
    return json({ error: "Chat failed" }, 500);
  }
});
