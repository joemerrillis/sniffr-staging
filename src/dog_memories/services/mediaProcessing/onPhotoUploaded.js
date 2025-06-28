// src/dog_memories/services/mediaProcessing/onPhotoUploaded.js

import {
  getDogNamesFromIds,
  getMostRecentEmbeddingIdForDog,
  getEmbeddingVectorById
} from './helpers.js';

import {
  callEmbeddingWorker,
  callDesignerWorker,
  callCaptionWorker,
  callTagsWorker
} from './workers.js';

export async function onPhotoUploaded({ memory }) {
  const dogNames = await getDogNamesFromIds(memory.dog_ids);
  const eventType = memory.event_type || null;

  // 1. Fire embedding (fire-and-forget)
  callEmbeddingWorker(memory, dogNames);

  // 2. Find single dog_id, get most recent embedding_id
  let personalitySummary = null;
  const dogId = Array.isArray(memory.dog_ids) ? memory.dog_ids[0] : memory.dog_ids;
  let embeddingId = null;
  if (dogId) {
    embeddingId = await getMostRecentEmbeddingIdForDog(dogId);
  }

  // 3. Fire designer, WAIT for result, passing embedding vector
  try {
    personalitySummary = await callDesignerWorker(memory, dogId, embeddingId, getEmbeddingVectorById);
  } catch (e) {
    console.error("[DesignerWorker] Error (proceeding without personality):", e);
  }

  // 4. Fire caption, passing personalitySummary
  await callCaptionWorker(memory, dogNames, eventType, personalitySummary);

  // 5. Fire tags, passing personalitySummary
  await callTagsWorker(memory, dogNames, personalitySummary);
}
