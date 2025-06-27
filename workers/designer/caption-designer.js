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

    // --- Example: Query vector DB for personality-rich chat logs about this dog
    let matches;
    try {
      // Use a simple query for "describe personality" or "dog likes/dislikes"
      const query = "Describe the dog's personality, likes, dislikes, or funny stories";
      matches = await env.VECTORIZE_TEXT.query({
        topK: max,
        vector: null, // You could embed the query, or use a filter by dog_id
        filter: { dog_id },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: "Vector search failed", details: e.message }), { status: 500 });
    }

    // --- Collect relevant texts
    const texts = (matches?.matches || []).map(m => m.metadata?.body || '').filter(Boolean);

    // --- Summarize or just return snippets (basic version, LLM-powered summary could be next)
    const bullets = texts
      .slice(0, 8)
      .map(t => "- " + t.replace(/\n/g, ' ').slice(0, 140)); // clean, truncate

    // Optionally: Call out to Replicate/OpenAI to get a summary if needed here.

    return new Response(JSON.stringify({
      dog_id,
      personality_snippets: bullets,
      raw_texts: texts
    }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  }
};
