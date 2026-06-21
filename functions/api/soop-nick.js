const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

// 방송국 id로 현재 SOOP 닉네임을 가져오는 프록시 (CORS 회피 + 엣지 캐시)
export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const id = (url.searchParams.get("id") || "").trim();
  const J = (obj, status = 200, cache = false) =>
    new Response(JSON.stringify(obj), {
      status,
      headers: {
        ...CORS,
        "Content-Type": "application/json; charset=utf-8",
        ...(cache ? { "Cache-Control": "public, max-age=3600" } : {})
      }
    });

  if (!id) return J({ nick: null, error: "id required" }, 400);

  try {
    const res = await fetch(`https://chapi.sooplive.co.kr/api/${encodeURIComponent(id)}/station`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://www.sooplive.co.kr/"
      }
    });
    if (!res.ok) return J({ id, nick: null }, 200, true);
    const data = await res.json();
    const nick =
      (data && data.station && (data.station.user_nick || data.station.station_name)) ||
      (data && data.user_nick) ||
      null;
    return J({ id, nick }, 200, true);
  } catch (e) {
    return J({ id, nick: null }, 200);
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}
