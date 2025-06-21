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

    // Fetch the image as an ArrayBuffer
    let imageBuffer;
    try {
      const imgRes = await fetch(image_url);
      if (!imgRes.ok) throw new Error("Could not fetch image");
      imageBuffer = await imgRes.arrayBuffer();
    } catch (e) {
      return new Response(JSON.stringify({ error: "Image fetch failed", details: e.message }), { status: 400 });
    }

    // Call Workers AI for embedding
    let embedding;
    try {
      const aiRes = await env.AI.run(
        "@cf/unum/uform-gen2-qwen-500m",
        {
          image: [...new Uint8Array(imageBuffer)],
        }
      );
      // Cloudflare guidance: use only .data
      embedding = aiRes.data;
      // Optionally log for debugging:
      // console.log("AI response:", JSON.stringify(aiRes));
    } catch (e) {
      return new Response(JSON.stringify({ error: "AI embedding failed", details: e.message }), { status: 500 });
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
