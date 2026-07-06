import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { extractText, getDocumentProxy } from "https://esm.sh/unpdf@0.11.0";
import { unzipSync, strFromU8 } from "https://esm.sh/fflate@0.8.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_CONTENT_CHARS = 500_000;

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

async function extractPdf(bytes: Uint8Array): Promise<string> {
  const pdf = await getDocumentProxy(bytes);
  const { text } = await extractText(pdf, { mergePages: true });
  return Array.isArray(text) ? text.join("\n") : text;
}

function extractDocx(bytes: Uint8Array): string {
  const files = unzipSync(bytes);
  const xmlBytes = files["word/document.xml"];
  if (!xmlBytes) return "";
  const xml = strFromU8(xmlBytes);
  const withBreaks = xml
    .replace(/<\/w:p>/g, "\n")
    .replace(/<w:tab[^>]*\/>/g, "\t")
    .replace(/<w:br[^>]*\/>/g, "\n");
  const stripped = withBreaks.replace(/<[^>]+>/g, "");
  return decodeEntities(stripped);
}

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

    const { documentId } = await req.json();
    if (!documentId) return json({ error: "documentId is required" }, 400);

    const { data: profile } = await admin
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .maybeSingle();
    const companyId = profile?.company_id;
    if (!companyId) return json({ error: "No company for user" }, 403);

    const { data: doc, error: docErr } = await admin
      .from("documents")
      .select("id, company_id, storage_path, type, name")
      .eq("id", documentId)
      .maybeSingle();
    if (docErr || !doc) return json({ error: "Document not found" }, 404);
    if (doc.company_id !== companyId) return json({ error: "Forbidden" }, 403);

    const { data: file, error: dlErr } = await admin.storage
      .from("documents")
      .download(doc.storage_path);
    if (dlErr || !file) {
      await admin.from("documents").update({ status: "error" }).eq("id", doc.id);
      return json({ error: "Failed to download file" }, 500);
    }

    const bytes = new Uint8Array(await file.arrayBuffer());

    let text = "";
    try {
      if (doc.type === "pdf") {
        text = await extractPdf(bytes);
      } else if (doc.type === "docx") {
        text = extractDocx(bytes);
      } else {
        text = new TextDecoder().decode(bytes);
      }
    } catch (e) {
      console.error("[process-document] extraction error", e);
      await admin.from("documents").update({ status: "error" }).eq("id", doc.id);
      return json({ error: "Failed to extract text" }, 500);
    }

    const cleaned = (text || "").replace(/\u0000/g, "").trim().slice(0, MAX_CONTENT_CHARS);

    await admin
      .from("documents")
      .update({ content: cleaned, status: "ready" })
      .eq("id", doc.id);

    return json({ ok: true, chars: cleaned.length });
  } catch (e) {
    console.error("[process-document]", e);
    return json({ error: "Processing failed" }, 500);
  }
});
