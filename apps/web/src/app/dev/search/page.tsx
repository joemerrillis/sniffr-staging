"use client";
import { useState } from "react";

export default function DevSearchPage() {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function run(qq = q) {
    setLoading(true); setError("");
    try {
      const r = await fetch(`/dev/search/proxy?q=${encodeURIComponent(qq)}`);
      if (!r.ok) {
        setError(`Search server not available (${r.status}). Start it locally with: npx tsx tools/search-server.ts`);
        setHits([]);
      } else {
        const j = await r.json();
        setHits(j.hits || []);
      }
    } catch (e: any) {
      setError(e.message || String(e));
      setHits([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Dev Search</h1>
      <p className="text-sm opacity-80">
        This page calls a local search server at <code>http://127.0.0.1:7777</code> via a proxy route.
        Run <code>npx tsx tools/search-server.ts</code> in another terminal, then search below.
      </p>
      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="photo throttle"
          className="border rounded px-3 py-2 w-full"
        />
        <button
          onClick={() => run()}
          disabled={loading}
          className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}

      <div className="space-y-3">
        {hits.map((h, i) => (
          <div key={i} className="border rounded p-3">
            <div className="font-mono text-sm">
              {h.path} <span className="opacity-60">#{h.ord}</span>
              {typeof h.score === "number" && (
                <span className="ml-2">score {h.score.toFixed(3)}</span>
              )}
            </div>
            <pre className="whitespace-pre-wrap text-xs opacity-80">{h.snippet}</pre>
          </div>
        ))}
        {!loading && hits.length === 0 && (
          <div className="opacity-60 text-sm">No hits yet.</div>
        )}
      </div>
    </div>
  );
}
