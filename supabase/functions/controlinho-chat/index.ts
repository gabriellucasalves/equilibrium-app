// Edge Function: narrativa do Controlinho — OPENAI_API_KEY só como secret.
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
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return json({
        unavailable: true,
        message: "OPENAI_API_KEY not configured",
      });
    }

    const body = await req.json();
    const system = String(body.system ?? "");
    const payload = String(body.payload ?? "");
    if (!payload) {
      return json({ error: "payload_required" }, 400);
    }

    const model = Deno.env.get("OPENAI_MODEL") ?? "gpt-4o-mini";
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content:
              "Com base apenas neste JSON de toolResults, responda a pergunta do usuário:\n" +
              payload,
          },
        ],
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return json(
        { error: "openai_failed", detail: data?.error?.message ?? res.status },
        502,
      );
    }

    const answer = data?.choices?.[0]?.message?.content ?? "";
    return json({ answer, model });
  } catch (error) {
    return json({ error: "chat_failed", detail: String(error) }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
