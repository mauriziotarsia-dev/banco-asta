/* Proxy per la chiave API. Da incollare in un Cloudflare Worker.
   La chiave sta qui, sul server di Cloudflare, e non finisce mai nella
   pagina: chi apre il sito non puo' leggerla.
   Imposta ANTHROPIC_API_KEY fra le variabili del Worker (tipo "Secret"),
   e in ORIGINE metti l'indirizzo esatto del tuo GitHub Pages. */

const ORIGINE = "https://TUONOME.github.io";

export default {
  async fetch(req, env) {
    const cors = {
      "Access-Control-Allow-Origin": ORIGINE,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
    if (req.method === "OPTIONS") return new Response(null, { headers: cors });
    if (req.method !== "POST") return new Response("solo POST", { status: 405, headers: cors });
    if (req.headers.get("Origin") !== ORIGINE)
      return new Response("origine non consentita", { status: 403, headers: cors });

    const body = await req.text();
    if (body.length > 60000) return new Response("richiesta troppo grande", { status: 413, headers: cors });

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body,
    });
    return new Response(await r.text(), {
      status: r.status,
      headers: { ...cors, "content-type": "application/json" },
    });
  },
};
