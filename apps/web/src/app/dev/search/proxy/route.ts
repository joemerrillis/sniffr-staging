// Server route that proxies to the local search server (default 127.0.0.1:7777)
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || "";
  const base = process.env.NEXT_PUBLIC_SEARCH_HOST || "http://127.0.0.1:7777";
  try {
    const r = await fetch(`${base}/search?q=${encodeURIComponent(q)}`);
    const txt = await r.text();
    return new Response(txt, {
      status: r.status,
      headers: { "content-type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ hits: [], error: e?.message || String(e) }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }
}
