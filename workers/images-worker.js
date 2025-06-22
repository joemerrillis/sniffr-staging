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

    const { image_url, dog_name, meta } = data;
    if (!image_url || !dog_name) {
      console.log("Missing image_url or dog_name");
      return new Response(JSON.stringify({ error: "image_url and dog_name required" }), { status: 400 });
    }

    // --- DEBUG LOG: Input
    console.log("Input received:", { image_url, dog_name, meta });

    // Fetch the image as a buffer (as base64 for Replicate API)
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

      // --- DEBUG LOG: Image Fetch/Conversion
      console.log("Fetched image, contentType:", contentType, "Base64 length:", imageBase64.length);

    } catch (e) {
      console.log("Image fetch failed:", e);
      return new Response(JSON.stringify({ error: "Image fetch failed", details: e.message }), { status: 400 });
    }

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
          version: "1c0371070cb827ec3c7f2f28adcdde54b50dcd239aa6faea0bc98b174ef03fb4",
          input: { image: imageBase64 }
        }),
      });
      const startJson = await startRes.json();
      console.log("Replicate POST response status:", startRes.status);

      if (startRes.status !== 201) {
        console.log("Replicate API error JSON:", startJson);
        return new Response(JSON.stringify({ error: "Replicate API failed", details: startJson }), { status: 500 });
      }

      // Step 2: Poll until prediction is complete, using GET on the prediction ID
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
        const pollUrl = `https://api.replicate.com/v1/predictions/${startJson.id}`; // 👈 Use official GET endpoint!
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
    const id = crypto.randomUUID();
    const record = {
      id,
      values: embedding,
      metadata: {
        image_url,
        dog_name,
        ...meta
      }
    };
    console.log("Vectorize record:", record);

    // Store in Vectorize
    try {
      await env.VECTORIZE.insert([record]);
      console.log("Vectorize insert OK, id:", id);
      return new Response(JSON.stringify({ ok: true, id }), { status: 201, headers: { "content-type": "application/json" } });
    } catch (e) {
      console.log("Vectorize insert failed:", e);
      return new Response(JSON.stringify({ error: "Vectorize insert failed", details: e.message }), { status: 500 });
    }
  }
};
