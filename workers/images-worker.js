export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("Only POST allowed", { status: 405 });
    }
    const { dog_id, image_id, embedding } = await request.json();
    // Upsert the vector (embedding must be an array of 768 floats)
    await env.VECTORIZE.upsert([
      {
        id: `${dog_id}:${image_id}`,
        values: embedding,
        metadata: { dog_id, image_id }
      }
    ]);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }
}
