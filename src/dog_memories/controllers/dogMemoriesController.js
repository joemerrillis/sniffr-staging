// src/dog_memories/controllers/dogMemoriesController.js

import {
  insertDogMemory,
  getDogMemoryById,
  listDogMemoriesByDogId,
  listDogMemoriesByUploader,
  updateDogMemory,
  deleteDogMemory,
} from '../models/dogMemoryModel.js';

import { enrichDogMemories } from '../service/enrichDogMemories.js';
import { parseCaptionForEvents } from '../service/eventParser.js';

// CREATE (POST /dog-memories)
export async function create(request, reply) {
  try {
    const uploader_id = request.user?.id || request.body.uploader_id; // or pull from JWT/session
    const data = { ...request.body, uploader_id };
    const memory = await insertDogMemory(data);
    reply.code(201).send({ memory });
  } catch (err) {
    reply.code(400).send({ error: err.message });
  }
}

// GET BY ID (GET /dog-memories/:id)
export async function retrieve(request, reply) {
  try {
    const { id } = request.params;
    const memory = await getDogMemoryById(id);
    if (!memory) return reply.code(404).send({ error: 'Dog memory not found' });
    reply.send({ memory });
  } catch (err) {
    reply.code(400).send({ error: err.message });
  }
}

// LIST BY DOG (GET /dog-memories/dog/:dogId)
export async function listByDog(request, reply) {
  try {
    const { dogId } = request.params;
    const { limit, offset } = request.query;
    const memories = await listDogMemoriesByDogId(dogId, { limit, offset });
    reply.send({ memories });
  } catch (err) {
    reply.code(400).send({ error: err.message });
  }
}

// LIST BY UPLOADER (GET /dog-memories/uploader/:userId)
export async function listByUploader(request, reply) {
  try {
    const { userId } = request.params;
    const { limit, offset } = request.query;
    const memories = await listDogMemoriesByUploader(userId, { limit, offset });
    reply.send({ memories });
  } catch (err) {
    reply.code(400).send({ error: err.message });
  }
}

// UPDATE (PATCH /dog-memories/:id)
export async function modify(request, reply) {
  try {
    const { id } = request.params;
    const updates = request.body;
    const memory = await updateDogMemory(id, updates);
    if (!memory) return reply.code(404).send({ error: 'Dog memory not found' });
    reply.send({ memory });
  } catch (err) {
    reply.code(400).send({ error: err.message });
  }
}

// DELETE (DELETE /dog-memories/:id)
export async function remove(request, reply) {
  try {
    const { id } = request.params;
    const memory = await deleteDogMemory(id);
    if (!memory) return reply.code(404).send({ error: 'Dog memory not found' });
    reply.send({ success: true, memory });
  } catch (err) {
    reply.code(400).send({ error: err.message });
  }
}

// BATCH ENRICHMENT (POST /dog-memories/enrich-batch)
export async function enrichBatch(request, reply) {
  try {
    const { memoryIds } = request.body;
    const supabase = request.server.supabase;
    const memories = await enrichDogMemories(supabase, memoryIds);
    reply.send({ memories });
  } catch (err) {
    request.log?.error({ err }, "Error enriching dog memories");
    reply.code(500).send({ error: 'Enrichment failed', details: err.message });
  }
}

// SAVE & PARSE (PATCH /dog-memories/:id/save-parse)
export async function saveAndParseMemory(request, reply) {
  try {
    const { id } = request.params;
    const { caption, tags } = request.body;
    const supabase = request.server.supabase;

    // 1. Save the edited caption/tags
    const memory = await updateDogMemory(id, {
      ai_caption: caption,
      tags,
      updated_at: new Date().toISOString(),
    });
    if (!memory) return reply.code(404).send({ error: 'Dog memory not found' });

    // 2. Parse the new caption for events/tags
    let parsedEvents = [];
    try {
      parsedEvents = await parseCaptionForEvents(caption, tags, memory);
    } catch (e) {
      request.log?.warn({ e }, "Event parsing failed");
      parsedEvents = [];
    }

    reply.send({ memory, parsedEvents });
  } catch (err) {
    reply.code(400).send({ error: err.message });
  }
}
