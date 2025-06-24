// workers/chat/embed-chat-worker.js

export default {
  async fetch(request, env, ctx) {
    if (request.method !== "POST") {
      return new Response("Only POST allowed", { status: 405 });
    }

    let data;
    try {
      data = await request.json();
    } catch (e) {
      console.log("Invalid JSON:", e);
      return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
    }

    const { message_id, body, meta } = data;
    if (!message_id || !body || !body.trim()) {
      console.log("Missing message_id or body");
      return new Response(JSON.stringify({ error: "message_id and body required" }), { status: 400 });
    }

    // --- DEBUG LOG: Input
    console.log("Input received:", { message_id, body, meta });

    // --- DEBUG LOG: Replicate Token
    console.log("Replicate token (first 8 chars):", env.REPLICATE_API_TOKEN ? env.REPLICATE_API_TOKEN.substring(0,8) : 'undefined');

    // Call Replicate API for embedding using async polling pattern
    let embedding;
    try {
      const replicateToken = env.REPLICATE_API_TOKEN ? env.REPLICATE_API_TOKEN.trim() : '';
      console.log("Using Replicate Token (trimmed, first 8):", replicateToken.substring(0,8));

      // Step 1: Start the prediction (POST)
      const startRes = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${replicateToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          version: "c08caa37eb7c7a3c2e6f4c2c4279e8f2e207799cae64b98fc87104d10eae960c", // Example: "text-embedding-ada-002" (replace with your model)
          input: { text: body }
        }),
      });
      const startJson = await startRes.json();
      console.log("Replicate POST response status:", startRes.status);

      if (startRes.status !== 201) {
        console.log("Replicate API error JSON:", startJson);
        return new Response(JSON.stringify({ error: "Replicate API failed", details: startJson }), { status: 500 });
      }

      // Step 2: Poll until prediction is complete
      let prediction = startJson;
      let pollCount = 0;
      const maxPolls = 25;
      while (["starting", "processing"].includes(prediction.status)) {
        pollCount++;
        if (pollCount > maxPolls) {
          console.log("Replicate polling exceeded max limit; still running.");
          return new Response(JSON.stringify({ error: "Replicate polling timeout", details: prediction }), { status: 504 });
        }
        await new Promise(r => setTimeout(r, 5000));
        const pollUrl = `https://api.replicate.com/v1/predictions/${startJson.id}`;
        const pollRes = await fetch(pollUrl, {
          headers: { "Authorization": `Bearer ${replicateToken}` }
        });
        prediction = await pollRes.json();
        console.log(`Polling prediction status (try ${pollCount}):`, prediction.status);
      }
      if (prediction.status !== "succeeded") {
        console.log("Replicate prediction failed:", prediction);
        return new Response(JSON.stringify({ error: "Replicate prediction failed", details: prediction }), { status: 500 });
      }
      embedding = prediction.output.embedding;
      console.log("Embedding received, length:", embedding ? embedding.length : "null");

    } catch (e) {
      console.log("Replicate embedding failed:", e);
      return new Response(JSON.stringify({ error: "Replicate embedding failed", details: e.message }), { status: 500 });
    }

    if (!embedding || !Array.isArray(embedding)) {
      console.log("No embedding returned");
      return new Response(JSON.stringify({ error: "No embedding returned" }), { status: 500 });
    }

    // Compose the Vectorize record
    const id = message_id; // Use message_id as the vector doc ID for easy dedupe
    const record = {
      id,
      values: embedding,
      metadata: {
        ...meta,
        body, // Keep original message text for retrieval/RAG
      }
    };
    console.log("Vectorize TEXT record:", record);

    // Store in Vectorize (dedicated text index)
    try {
      await env.VECTORIZE_TEXT.insert([record]);
      console.log("Vectorize insert OK, id:", id);
      return new Response(JSON.stringify({ ok: true, id }), { status: 201, headers: { "content-type": "application/json" } });
    } catch (e) {
      console.log("Vectorize insert failed:", e);
      return new Response(JSON.stringify({ error: "Vectorize insert failed", details: e.message }), { status: 500 });
    }
  }
};
