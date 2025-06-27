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

    // --- Query vector DB for personality-rich chat logs about this dog
    let matches;
    try {
      const query = "Describe the dog's personality, likes, dislikes, or funny stories";
      matches = await env.VECTORIZE_TEXT.query({
        topK: max,
        vector: null,
        filter: { dog_id }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: "Vector search failed", details: e.message }), { status: 500 });
    }

    // --- Collect relevant texts
    const texts = (matches?.matches || []).map(m => m.metadata?.body || '').filter(Boolean);

    // --- Prepare a summary: join a few of the best lines into a single string
    const bullets = texts
      .slice(0, 8)
      .map(t => t.replace(/\n/g, ' ').slice(0, 160));

    let personalitySummary;
    if (bullets.length > 0) {
      personalitySummary = bullets.join(" ");
    } else {
      personalitySummary = "No known personality details yet. Try chatting more about this dog!";
    }

    // --- [Optional] Summarize using an LLM (e.g., Replicate/OpenAI)
    /*
    if (bullets.length > 0 && env.REPLICATE_API_TOKEN) {
      // If you want to use an LLM, uncomment and adjust this
      const prompt = `Summarize the following about the dog's personality for use in writing captions:\n\n${bullets.join("\n")}\n\nSummary:`;
      const replicateRes = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.REPLICATE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          version: "<your-text-generation-model-id>",
          input: { prompt }
        }),
      });
      const replicateJson = await replicateRes.json();
      // Parse and set personalitySummary accordingly
      if (replicateJson.output && typeof replicateJson.output === 'string') {
        personalitySummary = replicateJson.output.trim();
      }
    }
    */

    return new Response(JSON.stringify({
      dog_id,
      personalitySummary,
      personality_snippets: bullets, // for debug/curiosity/future
      raw_texts: texts
    }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  }
};
