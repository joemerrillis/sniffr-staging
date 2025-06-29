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

    // --- (1) Find most recent chat embedding for this dog
    let queryVector = null;
    try {
      const matches = await env.VECTORIZE_TEXT.query({
        topK: 1,
        filter: { dog_ids: dog_id },  // <--- CHANGE HERE
      });
      if (
        matches?.matches?.[0]?.values &&
        Array.isArray(matches.matches[0].values) &&
        matches.matches[0].values.length === 768
      ) {
        queryVector = matches.matches[0].values;
      }
    } catch (e) {
      console.error("[DesignerWorker] Error fetching recent vector:", e);
      queryVector = null;
    }

    // --- (2) Semantic search for personality-rich messages
    let matches;
    try {
      const vectorQuery = {
        topK: max,
        filter: { dog_ids: dog_id }  // <--- CHANGE HERE TOO
      };
      if (queryVector) {
        vectorQuery.vector = queryVector;
      }
      matches = await env.VECTORIZE_TEXT.query(vectorQuery);
    } catch (e) {
      return new Response(JSON.stringify({ error: "Vector search failed", details: e.message }), { status: 500 });
    }

    // --- (3) Collect relevant texts
    const texts = (matches?.matches || [])
      .map(m => m.metadata?.body || '')
      .filter(Boolean);

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
      raw_texts: texts
    }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  }
};
