import {
  getDogNamesFromIds,
} from './helpers.js';

import {
  callEmbeddingWorker,
  callPersonalityWorker,
  callCaptionWorker,
  callTagsWorker
} from './workers.js';

export async function onPhotoUploaded({ memory }) {
  /*
  const dogNames = await getDogNamesFromIds(memory.dog_ids);
  const eventType = memory.event_type || null;

  // 1. Fire embedding (fire-and-forget)
  callEmbeddingWorker(memory, dogNames);

  // 2. Get the dog ID (for single-dog logic)
  const dogId = Array.isArray(memory.dog_ids) ? memory.dog_ids[0] : memory.dog_ids;

  // 3. Fire designer, WAIT for result, passing only dogId (no embedding/vector needed)
  let personalitySummary = null;
  try {
    personalitySummary = await callPersonalityWorker(memory, dogId);
  } catch (e) {
    console.error("[DesignerWorker] Error (proceeding without personality):", e);
  }

  // 4. Fire caption, passing personalitySummary
  await callCaptionWorker(memory, dogNames, eventType, personalitySummary);

  // 5. Fire tags, passing personalitySummary
  await callTagsWorker(memory, dogNames, personalitySummary);
  */
}
