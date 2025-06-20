// src/dog_memories/services/mediaProcessing.js

import fetch from 'node-fetch';
import { updateDogMemory } from '../models/dogMemoryModel.js';
import { getDogById } from '../../dogs/models/dogModel.js'; // adjust path if needed

// Helper to get dog name from dog_ids array (uses the first ID if multiple)
async function getDogNameFromIds(dogIds) {
  if (!dogIds || !dogIds.length) return "Unknown";
  try {
    const dog = await getDogById(dogIds[0]);
    return dog?.name || "Unknown";
  } catch (e) {
    console.error("[mediaProcessing] getDogById failed:", e);
    return "Unknown";
  }
}

export async function onPhotoUploaded({ memory }) {
  // memory: the full DB record after insert

  // 1. Look up dog name (sync for onboarding, future: smarter inference)
  const dogName = await getDogNameFromIds(memory.dog_ids);

  // 2. Call the Cloudflare Worker for embedding
  const vectorizeUrl = process.env.CF_VECTORIZE_URL;
  if (!vectorizeUrl) {
    console.error("[mediaProcessing] CF_VECTORIZE_URL is not set in env!");
  }
  const payload = {
    image_url: memory.image_url,
    dog_name: dogName,
    meta: {
      memory_id: memory.id,
      dog_ids: memory.dog_ids,
      // ...add any other metadata you want here
    }
  };

  let embedding_id = null, embedding_version = null, vector_status = 'error';

  try {
    console.error("[mediaProcessing] Calling Cloudflare Worker:", {
      url: vectorizeUrl,
      payload
    });

    const res = await fetch(vectorizeUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });

    let data;
    try {
      data = await res.json();
    } catch (jsonErr) {
      data = { error: "[mediaProcessing] Could not parse JSON from worker", details: jsonErr.message };
    }

    // Log raw response for debug
    console.error("[mediaProcessing] Cloudflare Worker response:", {
      status: res.status,
      data
    });

    if (res.ok && data.id) {
      embedding_id = data.id;
      embedding_version = 'clip-v1'; // Use your actual model/version as needed
      vector_status = 'complete';
    } else {
      vector_status = 'error';
      // Log for diagnostics
      console.error("[mediaProcessing] Worker call failed:", {
        status: res.status,
        body: data
      });
    }
  } catch (e) {
    vector_status = 'error';
    console.error("[mediaProcessing] Error while calling worker:", e);
  }

  // 3. Update the dog_memories record with vector info (append to meta as well)
  try {
    await updateDogMemory(memory.id, {
      embedding_id,
      embedding_version,
      meta: {
        ...memory.meta,
        vector_status,
        vectorize_at: new Date().toISOString()
      }
    });
  } catch (dbErr) {
    console.error("[mediaProcessing] Failed to update dog memory with vector info:", dbErr);
  }
}
