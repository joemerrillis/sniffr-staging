export default {
  async fetch(request, env, ctx) {
    if (request.method !== "POST") {
      return new Response("Only POST allowed", { status: 405 });
    }

    // --- Parse request body
    let data;
    try {
      data = await request.json();
    } catch (e) {
      console.log("[PersonalityWorker] Invalid JSON body:", e);
      return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
    }

    const { dog_id, embedding_id, max = 10 } = data;
    if (!dog_id) {
      console.log("[PersonalityWorker] dog_id missing in request");
      return new Response(JSON.stringify({ error: "dog_id required" }), { status: 400 });
    }

    let matches = null;

    try {
      if (embedding_id) {
       // --- Use queryById if an embedding_id is provided!
console.log(`[PersonalityWorker] Using queryById with embedding_id: ${embedding_id}, dog_id: ${dog_id}, max: ${max}`);
matches = await env.VECTORIZE_TEXT.queryById(embedding_id, {
  topK: max,
  filter: { dog_id }, // Now this will work!
  returnValues: true,
  returnMetadata: "all"
});
console.log(`[PersonalityWorker] queryById result count: ${matches?.matches?.length || 0}`);

      } else {
        // --- Fallback: basic filtered query (no semantic search)
        console.log(`[PersonalityWorker] No embedding_id. Using basic filter query with dog_id: ${dog_id}, max: ${max}`);
        matches = await env.VECTORIZE_TEXT.query({
          topK: max,
          filter: { dog_id },
          returnValues: true,
          returnMetadata: "all"
        });
        console.log(`[PersonalityWorker] filter query result count: ${matches?.matches?.length || 0}`);
      }
    } catch (e) {
      console.error("[PersonalityWorker] Vector search failed:", e);
      return new Response(JSON.stringify({
        error: "Vector search failed",
        details: (e?.message || e)
      }), { status: 500 });
    }

    // --- Collect relevant text & all metadata
    const rawMatches = matches?.matches || [];
    const texts = rawMatches.map(m => m.metadata?.body || '').filter(Boolean);

    // --- Build a human summary (for now: just concatenate, as before)
    const bullets = texts.slice(0, 8).map(t => t.replace(/\n/g, ' ').slice(0, 160));
    let personalitySummary = bullets.length
      ? bullets.join(" ")
      : "No known personality details yet. Try chatting more about this dog!";

    // --- Compose result
    const result = {
      dog_id,
      personalitySummary,
      personality_snippets: bullets,
      raw_texts: texts,
      raw_matches: rawMatches // full metadata, for debugging or inspection
    };

    console.log("[PersonalityWorker] Sending result:", JSON.stringify(result));

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  }
};
