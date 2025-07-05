// src/walk_reports/service/workers.js

// PERSONALITY WORKER (aka Designer/Personality Profile)
export async function callPersonalityWorker(dogId, embeddingId) {
  const url = process.env.CF_PERSONALITY_URL;
  if (!url) {
    console.error("[PersonalityWorker] No CF_PERSONALITY_URL set");
    return null;
  }
  if (!dogId) {
    console.error("[PersonalityWorker] No dog_id provided.");
    return null;
  }

  const payload = {
    dog_id: dogId,
    embedding_id: embeddingId,
    max: 10
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log("[PersonalityWorker] Response:", JSON.stringify(data));
    // You may want to return the whole data object, or just the summary string.
    if (res.ok && typeof data.personalitySummary === "string") {
      return data.personalitySummary;
    }
    return null;
  } catch (e) {
    console.error("[PersonalityWorker] Error:", e);
    return null;
  }
}

// CAPTION WORKER
export async function callCaptionWorker(photo, dogNames, eventType = null, personalitySummary = null) {
  const url = process.env.CF_CAPTION_URL;
  if (!url) {
    console.error("[CaptionWorker] No CF_CAPTION_URL set");
    return null;
  }

  const payload = {
    image_url: photo.image_url,
    dog_names: dogNames,
    event_type: eventType,
    meta: {
      memory_id: photo.id,
      dog_ids: photo.dog_ids,
      personalitySummary
    }
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log("[CaptionWorker] Response:", JSON.stringify(data));
    if (res.ok && Array.isArray(data.output)) {
      return data.output.join(' ').trim();
    }
    return null;
  } catch (e) {
    console.error("[CaptionWorker] Error:", e);
    return null;
  }
}

// TAGS WORKER
export async function callTagWorker(photo, dogNames, personalitySummary = null) {
  const url = process.env.CF_TAGS_URL;
  if (!url) {
    console.error("[TagWorker] No CF_TAGS_URL set");
    return null;
  }

  const payload = {
    image_url: photo.image_url,
    dog_names: dogNames,
    meta: {
      memory_id: photo.id,
      dog_ids: photo.dog_ids,
      personalitySummary
    }
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log("[TagWorker] Response:", JSON.stringify(data));
    if (res.ok && Array.isArray(data.tags)) {
      return data.tags;
    }
    return null;
  } catch (e) {
    console.error("[TagWorker] Error:", e);
    return null;
  }
}

// (Optional) EMBEDDING WORKER (if you need to fire it from here too)
export async function callEmbeddingWorker(photo, dogNames) {
  const url = process.env.CF_EMBEDDING_URL;
  if (!url) {
    console.error("[EmbeddingWorker] No CF_EMBEDDING_URL set");
    return null;
  }

  const payload = {
    image_url: photo.image_url,
    dog_names: dogNames,
    meta: {
      memory_id: photo.id,
      dog_ids: photo.dog_ids
    }
  };

  try {
    // Fire and forget
    fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(e => {
      console.error("[EmbeddingWorker] Error:", e);
    });
  } catch (e) {
    console.error("[EmbeddingWorker] Error:", e);
  }
}
