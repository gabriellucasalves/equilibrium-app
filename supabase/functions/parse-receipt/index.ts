// Edge Function: OCR / NFC-e parsing — API keys only as secrets.
// Secrets opcionais: OCR_SPACE_API_KEY
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  try {
    const body = await req.json();
    const mode = body.mode ?? "ocr";

    if (mode === "nfce") {
      const qrUrl = String(body.qrUrl ?? "");
      if (!qrUrl.startsWith("http")) {
        return json({ blocked: true, reason: "invalid_url" }, 400);
      }
      const res = await fetch(qrUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; EquilibriumReceiptBot/1.0; +https://equilibrium.app)",
          Accept: "text/html,application/xhtml+xml",
        },
        redirect: "follow",
      });
      const html = await res.text();
      if (
        !res.ok ||
        /captcha|cloudflare|acesso negado|just a moment|cf-browser-verification/i
          .test(html)
      ) {
        return json({ blocked: true, qrUrl });
      }
      const rawText = html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, "\n")
        .replace(/\n+/g, "\n");
      return json({ rawText, blocked: false, confidence: 0.65 });
    }

    // OCR mode
    const apiKey = Deno.env.get("OCR_SPACE_API_KEY");
    if (!apiKey) {
      return json({
        unavailable: true,
        message: "OCR_SPACE_API_KEY not configured",
      });
    }

    const imageBase64 = String(body.imageBase64 ?? "");
    const mimeType = String(body.mimeType ?? "image/jpeg");
    if (!imageBase64) {
      return json({ error: "image_required" }, 400);
    }

    const form = new FormData();
    form.append("base64Image", `data:${mimeType};base64,${imageBase64}`);
    form.append("language", "por");
    form.append("isOverlayRequired", "false");
    form.append("OCREngine", "2");

    const ocrRes = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      headers: { apikey: apiKey },
      body: form,
    });
    const ocrJson = await ocrRes.json();
    const rawText =
      ocrJson?.ParsedResults?.[0]?.ParsedText ??
      ocrJson?.parsedResults?.[0]?.parsedText ??
      "";

    if (!rawText) {
      return json({
        rawText: "",
        confidence: 0.2,
        warning: "empty_ocr",
      });
    }

    return json({ rawText, confidence: 0.75 });
  } catch (error) {
    return json(
      { error: "parse_failed", detail: String(error) },
      500,
    );
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
