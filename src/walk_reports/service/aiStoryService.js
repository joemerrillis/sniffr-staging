// Stub: Replace with real worker or OpenAI/Cloudflare LLM logic
export async function generateAIStory(dog_id, photos) {
  // Example AI call: returns an array [{memory_id, ai_caption}]
  return photos.map((photo, idx) => ({
    memory_id: photo.id,
    ai_caption: `Photo ${idx + 1}: "Hi! I'm your dog and here's my story for this pic!"`
  }));
}
