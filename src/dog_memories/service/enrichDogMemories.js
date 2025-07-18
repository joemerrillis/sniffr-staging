import fetch from 'node-fetch';
import { getDogMemoriesByIds, updateDogMemory } from './dogMemoriesService.js';

// Helper to call a Cloudflare worker and handle errors/logging
async function callWorker(url, payload) {
  console.log(`[Orchestrator] Calling worker at ${url}:`, JSON.stringify(payload, null, 2));
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Worker at ${url} error: ${err}`);
  }
  const result = await res.json();
  console.log(`[Orchestrator] Response from worker at ${url}:`, JSON.stringify(result, null, 2));
  return result;
}

// Helper to get the most recent embedding_id for a dog (from chat_messages table)
async function getMostRecentEmbeddingIdForDog(supabase, dogId) {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('embedding_id')
    .contains('dog_ids', [dogId])
    .not('embedding_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1);
  if (error) throw error;
  if (data && data.length > 0) return data[0].embedding_id;
  return null;
}

/**
 * Main orchestrator for batch-enriching dogMemories.
 * @param {Object} supabase - Supabase client instance
 * @param {string[]} memoryIds - Array of dog_memories ids to enrich
 * @returns {Array} - Array of enriched photo objects
 */
export async function enrichDogMemories(supabase, memoryIds) {
  // 1. Fetch all selected photos (dog_memories)
  const photos = await getDogMemoriesByIds(supabase, memoryIds);
  if (!Array.isArray(photos) || photos.length === 0) throw new Error('No dog_memories found.');

  // 2. Get all unique dogIds from photos
  const dogIds = Array.from(new Set(photos.flatMap(p => p.dog_ids || [])));

  // 3. For each unique dog, get their most recent embedding and run personality worker
  const personalitySummaries = {};
  for (const dogId of dogIds) {
    if (!personalitySummaries[dogId]) {
      const embedding_id = await getMostRecentEmbeddingIdForDog(supabase, dogId);
      if (!embedding_id) {
        console.warn(`[Orchestrator] No embedding_id found for dog ${dogId}. Using empty profile.`);
        personalitySummaries[dogId] = "";
      } else {
        const workerResult = await callWorker(process.env.CF_PERSONALITY_URL, { dog_id: dogId, embedding_id });
        personalitySummaries[dogId] = workerResult.personalitySummary || "";
      }
    }
  }

  // 4. For each photo, fire off caption/tag worker calls in parallel (does NOT save results yet)
  const photoJobs = photos.map(async (photo) => {
    const dog_id = (photo.dog_ids && photo.dog_ids[0]) || null;
    const dogNames = photo.dog_names || []; // Adjust as needed if you store names elsewhere
    const personalitySummary = dog_id ? personalitySummaries[dog_id] : "";

    const captionPayload = {
      image_url: photo.image_url,
      dog_names: dogNames,
      event_type: photo.event_type || "",
      meta: {
        dog_ids: photo.dog_ids,
        personalitySummary,
        memory_id: photo.id,
      },
    };
    const tagsPayload = {
      image_url: photo.image_url,
      dog_names: dogNames,
      meta: {
        dog_ids: photo.dog_ids,
        personalitySummary,
        memory_id: photo.id,
      },
    };

    // Fire caption and tags workers in parallel
    const [captionResult, tagsResult] = await Promise.all([
      callWorker(process.env.CF_CAPTION_URL, captionPayload),
      callWorker(process.env.CF_TAGS_URL, tagsPayload),
    ]);

    // Standardize AI outputs
    const ai_caption =
      Array.isArray(captionResult.output)
        ? captionResult.output.join(' ').trim()
        : captionResult.caption || '';
    let tags = Array.isArray(tagsResult.output)
      ? tagsResult.output.map(t => t.trim())
      : tagsResult.tags || [];
    tags = [...new Set(tags.filter(Boolean))];

    // Return results for preview/edit (do NOT save to DB yet)
    return {
      id: photo.id,
      url: photo.image_url,
      ai_caption,
      tags,
      dog_ids: photo.dog_ids,
      dog_names: dogNames,
      event_type: photo.event_type || "",
    };
  });

  // Wait for all enrichment jobs to finish and return results for UI display
  const results = await Promise.all(photoJobs);
  return results;
}
