// workers/summary/summary-worker.js

import { buildSummaryPrompt } from '../utils/promptUtils.js';

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

    const { photos = [], personalities = [], dog_names = [] } = data;
    if (!photos.length) {
      return new Response(JSON.stringify({ error: "photos array required" }), { status: 400 });
    }

    // Build the prompt
    const prompt = buildSummaryPrompt({
      photos,
      personalities,
      dogNames: dog_names
    });

    // Use Replicate Haiku model (same as your personality worker)
    const MODEL_VERSION = env.REPLICATE_HAIKU_MODEL_VERSION || "b2e6691fd53b4527a6e43b9a7a083ec27e90117059e1c3dd32e4e3a763349dad"; // Replace with your actual Haiku model version if different
    const replicateToken = env.REPLICATE_API_TOKEN ? env.REPLICATE_API_TOKEN.trim() : '';
    let predictionId = null;
    let output = null;

    try {
      // Start prediction (POST)
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
            max_tokens: 180,
            temperature: 0.65,
            top_p: 1
          }
        }),
      });

      const startJson = await startRes.json();
      if (startRes.status !== 201) {
        return new Response(JSON.stringify({ error: "Replicate API failed", details: startJson }), { status: 500 });
      }

      predictionId = startJson.id;

      // Poll for completion (GET)
      let prediction = startJson;
      let pollCount = 0;
      const maxPolls = 24;
      while (["starting", "processing"].includes(prediction.status)) {
        pollCount++;
        if (pollCount > maxPolls) {
          return new Response(JSON.stringify({ error: "Replicate polling timeout", details: prediction }), { status: 504 });
        }
        await new Promise(r => setTimeout(r, 4000));
        const pollUrl = `https://api.replicate.com/v1/predictions/${predictionId}`;
        const pollRes = await fetch(pollUrl, {
          method: "GET",
          headers: { "Authorization": `Bearer ${replicateToken}` }
        });
        prediction = await pollRes.json();
      }
      if (prediction.status !== "succeeded") {
        return new Response(JSON.stringify({ error: "Replicate prediction failed", details: prediction }), { status: 500 });
      }

      output = Array.isArray(prediction.output)
        ? prediction.output.join(" ").trim()
        : (prediction.output || "");

    } catch (e) {
      return new Response(JSON.stringify({ error: "Failed to generate summary", details: e.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ summary: output }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  }
};
