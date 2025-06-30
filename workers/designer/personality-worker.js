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

    // Accept both dog_id and optional embedding_id (for fine-tuned context)
    const { dog_id, embedding_id, max = 10 } = data;
    if (!dog_id) {
      return new Response(JSON.stringify({ error: "dog_id required" }), { status: 400 });
    }

    // --- Debug: Print ALL embeddings (sample)
    try {
      const matchesAll = await env.VECTORIZE_TEXT.query({ topK: 5 });
      console.log("[PersonalityWorker] ALL EMBEDDINGS SAMPLE:", JSON.stringify(matchesAll));
    } catch (e) {
      console.error("[PersonalityWorker] Error fetching all embeddings:", e);
    }

    // --- (1) Find the most recent or specific embedding for this dog
    let queryVector = null;
    if (embedding_id) {
      try {
        // Try to load a *specific* embedding vector by ID
        const match = await env.VECTORIZE_TEXT.query({
          topK: 1,
          filter: { id: embedding_id }
        });
        if (
          match?.matches?.[0]?.values &&
          Array.isArray(match.matches[0].values) &&
          match.matches[0].values.length === 768
        ) {
          queryVector = match.matches[0].values;
          console.log(`[PersonalityWorker] Found embedding vector for embedding_id: ${embedding_id}`);
        }
      } catch (e) {
        console.error(`[PersonalityWorker] Could not load vector for embedding_id ${embedding_id}:`, e);
      }
    }
    // If no embedding_id or couldn't find, just use most recent for the dog
    if (!queryVector) {
      try {
        const matches = await env.VECTORIZE_TEXT.query({
          topK: 1,
          filter: { dog_ids: dog_id }
        });
        if (
          matches?.matches?.[0]?.values &&
          Array.isArray(matches.matches[0].values) &&
          matches.matches[0].values.length === 768
        ) {
          queryVector = matches.matches[0].values;
          console.log(`[PersonalityWorker] Found recent vector for dog_id: ${dog_id}`);
        }
      } catch (e) {
        console.error("[PersonalityWorker] Error fetching recent vector for dog:", e);
        queryVector = null;
      }
    }

    // --- (2) Semantic search for personality-rich messages (by dog, using vector if found)
    let matches;
    try {
      const vectorQuery = {
        topK: max,
        filter: { dog_ids: dog_id }
      };
      if (queryVector) {
        vectorQuery.vector = queryVector;
        console.log("[PersonalityWorker] Using semantic vector search for dog_id:", dog_id);
      } else {
        console.log("[PersonalityWorker] Using pure filter search for dog_id:", dog_id);
      }
      matches = await env.VECTORIZE_TEXT.query(vectorQuery);
      console.log("[PersonalityWorker] Vector search results:", JSON.stringify(matches));
    } catch (e) {
      return new Response(JSON.stringify({ error: "Vector search failed", details: e.message }), { status: 500 });
    }

    // --- (3) Collect relevant texts and raw metadata
    const texts = (matches?.matches || [])
      .map(m => m.metadata?.body || '')
      .filter(Boolean);

    const rawMatches = matches?.matches || [];

    // --- (4) Make a summary
    const bullets = texts
      .slice(0, 8)
      .map(t => t.replace(/\n/g, ' ').slice(0, 160));

    let personalitySummary = bullets.length
      ? bullets.join(" ")
      : "No known personality details yet. Try chatting more about this dog!";

    return new Response(JSON.stringify({
      dog_id,
      personalitySummary,
      personality_snippets: bullets,
      raw_texts: texts,
      raw_matches: rawMatches // <--- this is the new field
    }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  }
};
