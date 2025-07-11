import { buildEventTagPrompt } from '../utils/promptUtils.js'; // see prompt utility below

export default {
  async fetch(request, env, ctx) {
    if (request.method !== "POST") {
      return new Response("Only POST allowed", { status: 405 });
    }

    // Parse and validate incoming JSON
    let data;
    try {
      data = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
    }

    // Accept transcript, max_completion_tokens, (optionally walk_report_id, meta, etc.)
    const {
      transcript = "",
      max_completion_tokens = 4096,
      walk_report_id = null,
      meta = {}
    } = data;

    if (!transcript || typeof transcript !== "string") {
      return new Response(JSON.stringify({ error: "Transcript required" }), { status: 400 });
    }

    // Build prompt
    const prompt = buildEventTagPrompt({ transcript });

    // Replicate config for o1-mini
    const MODEL_VERSION = "openai/o1-mini";
    const replicateToken = env.REPLICATE_API_TOKEN ? env.REPLICATE_API_TOKEN.trim() : '';

    // POST to Replicate to start prediction
    let result;
    try {
      const startRes = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${replicateToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          version: MODEL_VERSION,
          input: {
            prompt: prompt,
            max_completion_tokens: Math.max(1, Math.min(max_completion_tokens, 65536)) // schema-compliant
          }
        }),
      });
      const startJson = await startRes.json();

      if (startRes.status !== 201) {
        return new Response(JSON.stringify({ error: "Replicate API failed", details: startJson }), { status: 500 });
      }

      // Poll for status
      let prediction = startJson;
      let pollCount = 0;
      const maxPolls = 20;
      while (["starting", "processing"].includes(prediction.status)) {
        pollCount++;
        if (pollCount > maxPolls) {
          return new Response(JSON.stringify({ error: "Replicate polling timeout", details: prediction }), { status: 504 });
        }
        await new Promise(r => setTimeout(r, 3000));
        const pollUrl = `https://api.replicate.com/v1/predictions/${startJson.id}`;
        const pollRes = await fetch(pollUrl, {
          method: "GET",
          headers: { "Authorization": `Bearer ${replicateToken}` }
        });
        prediction = await pollRes.json();
      }
      if (prediction.status !== "succeeded") {
        return new Response(JSON.stringify({ error: "Replicate prediction failed", details: prediction }), { status: 500 });
      }

      result = prediction.output; // Should be array of strings, or single string

    } catch (e) {
      return new Response(JSON.stringify({ error: "Replicate model failed", details: e.message }), { status: 500 });
    }

    // Parse model output as JSON array of events
    let eventsAndTags;
    try {
      const text = Array.isArray(result) ? result[0] : result;
      eventsAndTags = JSON.parse(text);
    } catch (e) {
      return new Response(JSON.stringify({ error: "Failed to parse model output", raw: result }), { status: 500 });
    }

    return new Response(JSON.stringify({ output: eventsAndTags }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  }
};
