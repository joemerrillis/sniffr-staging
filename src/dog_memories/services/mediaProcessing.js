// src/dog_memories/services/mediaProcessing.js

import fetch from 'node-fetch';
import { updateDogMemory } from '../models/dogMemoryModel.js';

export async function onPhotoUploaded({ memory }) {
  // `memory` should be the full DB record after insert

  // 1. Call the Cloudflare Worker for embedding
  const vectorizeUrl = process.env.CF_VECTORIZE_URL;
  const dogName = /* look up dog name from dog_ids, or fallback */;
  const payload = {
    image_url: memory.image_url,
    dog_name: dogName,
    meta: {
      memory_id: memory.id,
      dog_ids: memory.dog_ids,
      // any other metadata you want...
    }
  };

  let embedding_id, embedding_version, vector_status = 'error';

  try {
    const res = await fetch(vectorizeUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (res.ok && data.id) {
      embedding_id = data.id;
      embedding_version = 'clip-v1'; // or whatever version you use
      vector_status = 'complete';
    } else {
      vector_status = 'error';
    }
  } catch (e) {
    vector_status = 'error';
  }

  // 2. Update the dog_memories record with vector info
  await updateDogMemory(memory.id, {
    embedding_id,
    embedding_version,
    meta: {
      ...memory.meta,
      vector_status,
      vectorize_at: new Date().toISOString()
    }
  });
}
