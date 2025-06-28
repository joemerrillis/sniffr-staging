import fetch from 'node-fetch';
import { updateDogMemory } from '../models/dogMemoryModel.js';
import { getDogById } from '../../dogs/models/dogModel.js';

// Helper to get all dog names, returns an array
async function getDogNamesFromIds(dogIds) {
  if (!dogIds || !dogIds.length) return [];
  const names = [];
  for (const id of dogIds) {
    try {
      const dog = await getDogById(id);
      if (dog?.name) names.push(dog.name);
    } catch (e) {
      console.error("[getDogNamesFromIds] Error fetching dog name:", e);
    }
  }
  return names.length ? names : ["Unknown"];
}

export async function onPhotoUploaded({ memory }) {
  const dogNames = await getDogNamesFromIds(memory.dog_ids);
  const eventType = memory.event_type || null;

  // (1) Fire embedding (fire-and-forget)
  callEmbeddingWorker(memory, dogNames);

  // (2) Fire designer, WAIT for result
  let personalitySummary = null;
  try {
    personalitySummary = await callDesignerWorker(memory);
  } catch (e) {
    console.error("[DesignerWorker] Error (proceeding without personality):", e);
  }

  // (3) Fire caption, passing personalitySummary
  await callCaptionWorker(memory, dogNames, eventType, personalitySummary);

  // (4) Fire tags, passing personalitySummary
  await callTagsWorker(memory, dogNames, personalitySummary);
}

// -- WORKER CALL HELPERS --

async function callEmbeddingWorker(memory, dogNames) {
  const vectorizeUrl = process.env.CF_VECTORIZE_URL;
  if (!vectorizeUrl) return console.error("[EmbeddingWorker] No CF_VECTORIZE_URL set");

  const payload = {
    image_url: memory.image_url,
    dog_names: dogNames,
    dog_name: dogNames[0] || "Unknown", // <--- Must be string
    meta: {
      memory_id: memory.id,
      dog_ids: memory.dog_ids,
      // ...add more as needed
    }
  };

  console.log("[EmbeddingWorker] Sending payload:", JSON.stringify(payload));

  try {
    const res = await fetch(vectorizeUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    console.log("[EmbeddingWorker] Response:", JSON.stringify(data));

    if (res.ok && data.id) {
      await updateDogMemory(memory.id, {
        embedding_id: data.id,
        embedding_version: 'clip-v1',
        meta: { ...memory.meta, vector_status: 'complete', vectorize_at: new Date().toISOString() }
      });
      console.log("[EmbeddingWorker] Embedding updated in DB.");
    } else {
      console.error("[EmbeddingWorker] Worker error:", data);
    }
  } catch (e) {
    console.error("[EmbeddingWorker] Error:", e);
  }
}

async function callDesignerWorker(memory) {
  const designerUrl = process.env.CF_DESIGNER_URL;
  if (!designerUrl) {
    console.error("[DesignerWorker] No CF_DESIGNER_URL set");
    return null;
  }

  // Extract single dog_id (if array, grab the first one)
  const dogId = Array.isArray(memory.dog_ids) ? memory.dog_ids[0] : memory.dog_ids;
  if (!dogId) {
    console.error("[DesignerWorker] No dog_id found in memory.");
    return null;
  }

  const payload = {
    dog_id: dogId,
    max: 10
  };

  console.log("[DesignerWorker] Sending payload:", JSON.stringify(payload));
  try {
    const res = await fetch(designerUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    console.log("[DesignerWorker] Response:", JSON.stringify(data));
    // Assume it returns: { personalitySummary: "..." }
    if (res.ok && typeof data.personalitySummary === "string") {
      return data.personalitySummary;
    }
    return null;
  } catch (e) {
    console.error("[DesignerWorker] Error:", e);
    return null;
  }
}

async function callCaptionWorker(memory, dogNames, eventType, personalitySummary = null) {
  const captionUrl = process.env.CF_CAPTION_URL;
  if (!captionUrl) return console.error("[CaptionWorker] No CF_CAPTION_URL set");

  const payload = {
    image_url: memory.image_url,
    dog_names: dogNames,
    event_type: eventType,
    meta: {
      memory_id: memory.id,
      dog_ids: memory.dog_ids,
      personalitySummary // Pass to caption-worker
    }
  };

  console.log("[CaptionWorker] Sending payload:", JSON.stringify(payload));

  try {
    const res = await fetch(captionUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    console.log("[CaptionWorker] Response:", JSON.stringify(data));

    if (res.ok && Array.isArray(data.output)) {
      const caption = data.output.join(' ').trim();
      await updateDogMemory(memory.id, { ai_caption: caption });
      console.log("[CaptionWorker] Caption updated in DB.");
    } else {
      console.error("[CaptionWorker] Worker error:", data);
    }
  } catch (e) {
    console.error("[CaptionWorker] Error:", e);
  }
}

async function callTagsWorker(memory, dogNames, personalitySummary = null) {
  const tagsUrl = process.env.CF_TAGS_URL;
  if (!tagsUrl) return console.error("[TagsWorker] No CF_TAGS_URL set");

  const payload = {
    image_url: memory.image_url,
    dog_names: dogNames,
    meta: {
      memory_id: memory.id,
      dog_ids: memory.dog_ids,
      personalitySummary // Pass to tags-worker
    }
  };

  console.log("[TagsWorker] Sending payload:", JSON.stringify(payload));

  try {
    const res = await fetch(tagsUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    console.log("[TagsWorker] Response:", JSON.stringify(data));

    if (res.ok && Array.isArray(data.output)) {
      let tags = [];
      for (const tagString of data.output) {
        tags = tags.concat(tagString.split(',').map(t => t.trim()));
      }
      tags = [...new Set(tags.filter(Boolean))];
      await updateDogMemory(memory.id, { tags });
      console.log("[TagsWorker] Tags updated in DB.");
    } else {
      console.error("[TagsWorker] Worker error:", data);
    }
  } catch (e) {
    console.error("[TagsWorker] Error:", e);
  }
}
