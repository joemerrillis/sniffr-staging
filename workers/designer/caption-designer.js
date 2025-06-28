// workers/designer/caption-designer.js

export default {
  async fetch(request, env, ctx) {
    if (request.method !== "POST") {
      return new Response("Only POST allowed", { status: 405 });
    }

    let data;
    try {
      data = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
    }

    const { dog_id, max = 10 } = data;
    if (!dog_id) {
      return new Response(JSON.stringify({ error: "dog_id required" }), { status: 400 });
    }

    // --- (1) Find most recent message with reaction and embedding
    let queryVector = null;
    try {
      // Look up most recent message for this dog with an embedding
      // NOTE: You can't directly query your Supabase DB from this worker;
      // you may want to pass the embedding_id in the POST, or pre-fetch it.
      // For demo, try to find the most recent *vector* for this dog in Vectorize:
      // (If you have the embedding_id, use get(embedding_id) below.)
      const matches = await env.VECTORIZE_TEXT.query({
        topK: 1,
        filter: { dog_id },
      });
      if (matches?.matches?.[0]?.values) {
        queryVector = matches.matches[0].values;
      }
    } catch (e) {
      // It is OK if no vector found; just fallback to keyword filter.
      queryVector = null;
    }

    // --- (2) Query for personality-rich chat logs for this dog, using queryVector if available
    let matches;
    try {
      matches = await env.VECTORIZE_TEXT.query({
        topK: max,
        vector: queryVector || null,
        filter: { dog_id }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: "Vector search failed", details: e.message }), { status: 500 });
    }

    // --- (3) Collect relevant texts
    const texts = (matches?.matches || []).map(m => m.metadata?.body || '').filter(Boolean);

    // --- (4) Prepare a summary: join a few of the best lines into a single string
    const bullets = texts
      .slice(0, 8)
      .map(t => t.replace(/\n/g, ' ').slice(0, 160));

    let personalitySummary;
    if (bullets.length > 0) {
      personalitySummary = bullets.join(" ");
    } else {
      personalitySummary = "No known personality details yet. Try chatting more about this dog!";
    }

    // --- [Optional] Summarize using LLM (as before, see commented section) ---

    return new Response(JSON.stringify({
      dog_id,
      personalitySummary,
      personality_snippets: bullets,
      raw_texts: texts
    }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  }
};
