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

    // Accept dog_id, embedding_id, max
    const { dog_id, embedding_id, max = 10 } = data;
    if (!dog_id) {
      return new Response(JSON.stringify({ error: "dog_id required" }), { status: 400 });
    }

    let matches;
    let summaryInputTexts = [];

    try {
      if (embedding_id) {
        matches = await env.VECTORIZE_TEXT.queryById(embedding_id, {
          topK: max,
          returnValues: true,
          returnMetadata: "all"
        });
      } else {
        matches = await env.VECTORIZE_TEXT.query({
          topK: max,
          filter: { dog_id },
          returnValues: true,
          returnMetadata: "all"
        });
      }
    } catch (e) {
      return new Response(JSON.stringify({ error: "Vector search failed", details: e.message }), { status: 500 });
    }

    // --- Collect relevant texts & all metadata
    const rawMatches = matches?.matches || [];
    const texts = rawMatches.map(m => m.metadata?.body || '').filter(Boolean);

    // Pick up to 10 snippets for LLM summary
    summaryInputTexts = texts.slice(0, 10);

    if (!summaryInputTexts.length) {
      const result = {
        dog_id,
        personalitySummary: "No known personality details yet. Try chatting more about this dog!",
        personality_snippets: [],
        raw_texts: [],
        raw_matches: rawMatches
      };
      console.log("[PersonalityWorker] Response object:", JSON.stringify(result));
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    }

    // --- Summarize with Replicate Claude 3.5 Haiku
    const replicateApiToken = env.REPLICATE_API_TOKEN; // Set as environment variable!
    const systemPrompt = `
You are a skilled dog walker in Jersey City. Your job is to write personality profiles based off of 10 chat logs. Each quote is from a separate entry, and all quotes refer to the same dog. Provide an overall personality summary.
`.trim();

    const promptText = summaryInputTexts.map(t => `- ${t}`).join('\n');

    let personalitySummary = "";
    try {
      const replicatePayload = {
        input: {
          prompt: promptText,
          system_prompt: systemPrompt,
          max_tokens: 512
        }
      };

      const replicateResp = await fetch("https://api.replicate.com/v1/models/anthropic/claude-3.5-haiku/predictions", {
        method: "POST",
        headers: {
          "Authorization": `Token ${replicateApiToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(replicatePayload)
      });

      const replicateResult = await replicateResp.json();

      if (replicateResult?.output && Array.isArray(replicateResult.output) && replicateResult.output.length > 0) {
        personalitySummary = replicateResult.output.join('').trim();
      } else {
        personalitySummary = "Summary model returned no usable output.";
      }
    } catch (e) {
      personalitySummary = "Could not generate summary (model error).";
    }

    // --- Compose response
    const bullets = summaryInputTexts.map(t => t.replace(/\n/g, ' ').slice(0, 160));
    const result = {
      dog_id,
      personalitySummary,
      personality_snippets: bullets,
      raw_texts: texts,
      raw_matches: rawMatches // full metadata for debug/inspection
    };

    // --- Only log the final result object
    console.log("[PersonalityWorker] Response object:", JSON.stringify(result));
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  }
};
