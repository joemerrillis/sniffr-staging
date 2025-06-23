import { buildTagsPrompt } from './utils/promptUtils.js';

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

    // Destructure with defaults
    const { dog_names = [] } = data || {};

    // Use your utility to build the prompt
    const prompt = buildTagsPrompt(dog_names);

    let data;
    try {
      data = await request.json();
    } catch (e) {
      console.log("Invalid JSON:", e);
      return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
    }

    const { image_url, dog_name, meta } = data;
    if (!image_url || !dog_name) {
      console.log("Missing image_url or dog_name");
      return new Response(JSON.stringify({ error: "image_url and dog_name required" }), { status: 400 });
    }

    // --- DEBUG LOG: Input
    console.log("Input received:", { image_url, dog_name, meta });

    // Fetch image as base64 Data URI
    let imageBuffer, imageBase64;
    try {
      const imgRes = await fetch(image_url);
      if (!imgRes.ok) throw new Error("Could not fetch image");
      imageBuffer = await imgRes.arrayBuffer();
      const uint8Array = new Uint8Array(imageBuffer);
      let binary = '';
      for (let i = 0; i < uint8Array.byteLength; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      imageBase64 = btoa(binary);
      const contentType = imgRes.headers.get("content-type") || "image/jpeg";
      imageBase64 = `data:${contentType};base64,${imageBase64}`;
      console.log("Fetched image, contentType:", contentType, "Base64 length:", imageBase64.length);
    } catch (e) {
      console.log("Image fetch failed:", e);
      return new Response(JSON.stringify({ error: "Image fetch failed", details: e.message }), { status: 400 });
    }

    // Replicate LLaVA-13B model version (as of June 2025)
    const MODEL_VERSION = "80537f9eead1a5bfa72d5ac6ea6414379be41d4d4f6679fd776e9535d1eb58bb";
    const replicateToken = env.REPLICATE_API_TOKEN ? env.REPLICATE_API_TOKEN.trim() : '';

    // SWAP PROMPT HERE per worker!
    // --- CAPTION PROMPT:
    // const prompt = `Write a vivid, emotionally engaging one-sentence Instagram-style caption for this photo of a dog named ${dog_name}. Keep it short and fun.`;

    // --- TAGS PROMPT:
    // const prompt = `List five short, comma-separated hashtags or descriptive words for this photo of a dog named ${dog_name}.`;

    const prompt = "List five short, comma-separated hashtags or descriptive words for this photo of a dog named ${dog_name}.";

    // Call Replicate: POST to start the prediction
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
            image: imageBase64,
            prompt: prompt,
            max_tokens: 128,
            temperature: 0.7,
            top_p: 1
          }
        }),
      });
      const startJson = await startRes.json();
      console.log("Replicate POST response status:", startRes.status);

      if (startRes.status !== 201) {
        console.log("Replicate API error JSON:", startJson);
        return new Response(JSON.stringify({ error: "Replicate API failed", details: startJson }), { status: 500 });
      }

      // Poll until "succeeded"
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

      result = prediction.output; // This is always an array of strings for LLaVA!

      // DEBUG: Show raw output for dev
      console.log("LLaVA output:", result);

    } catch (e) {
      console.log("Replicate model failed:", e);
      return new Response(JSON.stringify({ error: "Replicate model failed", details: e.message }), { status: 500 });
    }

    // Return as JSON (array of strings)
    return new Response(JSON.stringify({ output: result }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  }
};
