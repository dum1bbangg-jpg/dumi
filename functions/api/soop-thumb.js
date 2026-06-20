const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const vodId = url.searchParams.get("vod_id");

  if (!vodId) {
    return new Response(JSON.stringify({ error: "vod_id required" }), {
      status: 400, headers: { ...CORS, "Content-Type": "application/json" }
    });
  }

  try {
    const res = await fetch(`https://vod.sooplive.com/player/${vodId}/embed`, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
    });
    const html = await res.text();
    const match = html.match(/"thumbnailUrl"\s*:\s*"([^"]+)"/);
    const thumb = match ? match[1] : null;

    return new Response(JSON.stringify({ thumb }), {
      headers: { ...CORS, "Content-Type": "application/json" }
    });
  } catch(e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}
