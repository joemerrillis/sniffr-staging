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

    const { image_url, dog_name, meta } = data;
    if (!image_url || !dog_name) {
      return new Response(JSON.stringify({ error: "image_url and dog_name required" }), { status: 400 });
    }

    // Fetch the image as a buffer (as base64 for Replicate API)
    let imageBuffer, imageBase64;
    try {
      const imgRes = await fetch(image_url);
      if (!imgRes.ok) throw new Error("Could not fetch image");
      imageBuffer = await imgRes.arrayBuffer();
      // Replicate API expects a data URL (base64-encoded)
      const uint8Array = new Uint8Array(imageBuffer);
      let binary = '';
      for (let i = 0; i < uint8Array.byteLength; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      imageBase64 = btoa(binary); // browser/worker btoa
      // Format as a data URL
      const contentType = imgRes.headers.get("content-type") || "image/jpeg";
      imageBase64 = `data:${contentType};base64,${imageBase64}`;
    } catch (e) {
      return new Response(JSON.stringify({ error: "Image fetch failed", details: e.message }), { status: 400 });
    }

    // Call Replicate API for embedding
    let embedding;
    try {
      const replicateRes = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
          "Authorization": `Token ${env.REPLICATE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          version: "e4005b1c90c6ceab8ad4be80d3d0a41a7bc5a19e8dc6c9a6557b515df20607d6", // Clip Vit-L/14, from Replicate docs
          input: {
            image: imageBase64,
          }
        }),
      });

      const replicateJson = await replicateRes.json();
      if (replicateRes.status !== 201) {
        return new Response(JSON.stringify({ error: "Replicate API failed", details: replicateJson }), { status: 500 });
      }
      // Replicate API is async; poll the prediction endpoint until status is "succeeded"
      let prediction = replicateJson;
      while (["starting", "processing"].includes(prediction.status)) {
        await new Promise(r => setTimeout(r, 1000)); // wait 1 sec
        const pollRes = await fetch(prediction.urls.get, {
          headers: { "Authorization": `Token ${env.REPLICATE_API_TOKEN}` }
        });
        prediction = await pollRes.json();
      }
      if (prediction.status !== "succeeded") {
        return new Response(JSON.stringify({ error: "Replicate prediction failed", details: prediction }), { status: 500 });
      }
      embedding = prediction.output.embedding;
    } catch (e) {
      return new Response(JSON.stringify({ error: "Replicate embedding failed", details: e.message }), { status: 500 });
    }

    if (!embedding || !Array.isArray(embedding)) {
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

    // Store in Vectorize
    try {
      await env.VECTORIZE.insert([record]);
      return new Response(JSON.stringify({ ok: true, id }), { status: 201, headers: { "content-type": "application/json" } });
    } catch (e) {
      return new Response(JSON.stringify({ error: "Vectorize insert failed", details: e.message }), { status: 500 });
    }
  }
};
