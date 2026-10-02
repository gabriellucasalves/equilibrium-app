// Edge: busca externa — sem inventar. Nominatim opcional para lugares.
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
    const enabled = Deno.env.get("EXTERNAL_SEARCH_ENABLED");
    if (enabled === "false") {
      return json({ unavailable: true, message: "EXTERNAL_SEARCH_ENABLED=false" });
    }

    const body = await req.json();
    const kind = String(body.kind ?? "place");
    const city = String(body.city ?? "").trim();
    const state = String(body.state ?? "").trim();
    const query = String(body.query ?? "").trim();

    if (!city) {
      return json({ items: [], unavailable: true, message: "city_required" });
    }

    // Promoções/preços: só com provider configurado (não inventar)
    if (kind === "promotion" || kind === "price") {
      const key = Deno.env.get("PRICE_SEARCH_API_KEY");
      if (!key) {
        return json({
          unavailable: true,
          message: "Não encontrei promoções confiáveis para esse item agora.",
          items: [],
        });
      }
      // Placeholder: provider pago futuro
      return json({ unavailable: true, message: "provider_not_wired", items: [] });
    }

    // Lugares / atividades gratuitas via Nominatim (uso moderado, User-Agent obrigatório)
    if (
      kind === "place" ||
      kind === "free_activity" ||
      kind === "local_activity" ||
      kind === "public_service"
    ) {
      const q = [query || mapKindQuery(kind), city, state, "Brazil"]
        .filter(Boolean)
        .join(", ");
      const url =
        "https://nominatim.openstreetmap.org/search?" +
        new URLSearchParams({
          q,
          format: "json",
          limit: "5",
          addressdetails: "0",
        });

      const res = await fetch(url, {
        headers: {
          "User-Agent": "EquilibriumApp/1.0 (external-search; contact@equilibrium.app)",
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        return json({
          unavailable: true,
          message: "Falha ao consultar mapa/lugares",
          items: [],
        });
      }

      const rows = await res.json();
      const retrievedAt = new Date().toISOString();
      const items = (Array.isArray(rows) ? rows : []).map((row: Record<string, unknown>) => ({
        kind: kind === "public_service" ? "public_service" : "place",
        title: String(row.display_name ?? "Local").split(",")[0],
        description: String(row.display_name ?? ""),
        sourceName: "OpenStreetMap Nominatim",
        sourceUrl: row.osm_id
          ? `https://www.openstreetmap.org/${row.osm_type ?? "node"}/${row.osm_id}`
          : "https://www.openstreetmap.org/",
        location: `${city}, ${state}`,
        priceInCents: kind === "free_activity" ? 0 : null,
        coordinates:
          row.lat && row.lon
            ? { lat: Number(row.lat), lng: Number(row.lon) }
            : null,
        category: query || kind,
        retrievedAt,
      }));

      return json({ items, cacheHit: false });
    }

    return json({
      unavailable: true,
      message: "Tipo de busca sem provider configurado",
      items: [],
    });
  } catch (error) {
    return json({ error: "external_search_failed", detail: String(error) }, 500);
  }
});

function mapKindQuery(kind: string): string {
  if (kind === "free_activity") return "park";
  if (kind === "public_service") return "town hall";
  if (kind === "local_activity") return "cultural centre";
  return "park";
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
