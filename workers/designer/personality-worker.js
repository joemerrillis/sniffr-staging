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

    const rawMatches = matches?.matches || [];
    const texts = rawMatches.map(m => m.metadata?.body || '').filter(Boolean);

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

    // --- Summarize with Replicate Claude 3.5 Haiku ---
    const replicateApiToken = env.REPLICATE_API_TOKEN; // Set as environment variable!
    const systemPrompt = `
You are a skilled dog walker in Jersey City. Your job is to write personality profiles based off of 10 chat logs. Each quote is from a separate entry, and all quotes refer to the same dog. Provide an overall personality summary.
`.trim();

    const promptText = summaryInputTexts.map(t => `- ${t}`).join('\n');

    let personalitySummary = "";
    try {
      // Step 1: POST to /predictions
      const replicatePayload = {
        prompt: promptText,
        max_tokens: 512,
        system_prompt: systemPrompt
      };
      const replicateResp = await fetch(
        "https://api.replicate.com/v1/models/anthropic/claude-3.5-haiku/predictions",
        {
          method: "POST",
          headers: {
            "Authorization": `Token ${replicateApiToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ input: replicatePayload })
        }
      );
      const prediction = await replicateResp.json();
      const predictionId = prediction.id;

      // Step 2: Poll for result
      let result = prediction;
      let tries = 0;
      while (
        result.status !== "succeeded" &&
        result.status !== "failed" &&
        tries < 20
      ) {
        await new Promise(res => setTimeout(res, 1200));
        const pollResp = await fetch(
          `https://api.replicate.com/v1/predictions/${predictionId}`,
          {
            headers: {
              "Authorization": `Token ${replicateApiToken}`,
              "Content-Type": "application/json"
            }
          }
        );
        result = await pollResp.json();
        tries++;
      }

      if (result.status === "succeeded") {
        if (Array.isArray(result.output)) {
          personalitySummary = result.output.join("").trim();
        } else {
          personalitySummary = (result.output || "").trim();
        }
      } else {
        personalitySummary = "Summary model did not complete successfully.";
      }
    } catch (e) {
      personalitySummary = "Could not generate summary (model error).";
    }

    // --- Compose response
    const bullets = summaryInputTexts.map(t => t.replace(/\n/g, ' ').slice(0, 160));
    const responseResult = {
      dog_id,
      personalitySummary,
      personality_snippets: bullets,
      raw_texts: texts,
      raw_matches: rawMatches
    };

    return new Response(JSON.stringify(responseResult), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  }
};
