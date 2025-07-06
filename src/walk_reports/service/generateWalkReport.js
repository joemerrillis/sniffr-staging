// src/walk_reports/service/generateWalkReport.js

import fetch from 'node-fetch'; // If your runtime needs it
import {
  getWalkReportById,
  updateWalkReport,
  getDogMemoryById,
  updateDogMemory
} from './walkReportService.js';
// import { getDogNamesByIds } from '../dogs/dogService.js'; // Optional helper for real dog names

// Helper for calling any worker and handling HTTP errors
async function callWorker(url, payload) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Worker at ${url} error: ${err}`);
  }
  return await res.json();
}

export async function generateWalkReport(supabase, reportId) {
  // 1. Fetch walk report and all relevant dogs/photos
  const report = await getWalkReportById(supabase, reportId);
  if (!report) throw new Error('Walk report not found');
  const dogIds = report.dog_ids || [];
  const photoIds = report.photos || [];
  const photos = await Promise.all(photoIds.map(id => getDogMemoryById(supabase, id)));

  // 2. For each dog, call personality-worker and store summary
  const personalitySummaries = {};
  for (const dogId of dogIds) {
    // You should implement getMostRecentEmbeddingIdForDog for your schema
    const embedding_id = await getMostRecentEmbeddingIdForDog(supabase, dogId);
    const workerResult = await callWorker(process.env.CF_PERSONALITY_URL, { dog_id: dogId, embedding_id });
    personalitySummaries[dogId] = workerResult.personalitySummary || "";
  }

  // 3. For each photo, call caption-worker and tag-worker with personalitySummary
  const finalizedPhotos = [];
  for (const photo of photos) {
    const dog_id = (photo.dog_ids && photo.dog_ids[0]) || null;
    // Optional: Fetch actual dog names from your dogs table if you wish!
    // const dogNames = await getDogNamesByIds(photo.dog_ids);
    const dogNames = photo.dog_ids || [];
    const personalitySummary = dog_id ? personalitySummaries[dog_id] : "";

    // CAPTION WORKER
    const captionPayload = {
      image_url: photo.image_url,
      dog_names: dogNames,
      event_type: 'walk',
      meta: {
        dog_ids: photo.dog_ids,
        personalitySummary
      }
    };
    const captionResult = await callWorker(process.env.CF_CAPTION_URL, captionPayload);
    const ai_caption =
      Array.isArray(captionResult.output) ? captionResult.output.join(" ").trim() :
      (captionResult.caption || "");

    // TAGS WORKER
    const tagsPayload = {
      image_url: photo.image_url,
      dog_names: dogNames,
      meta: {
        dog_ids: photo.dog_ids,
        personalitySummary
      }
    };
    const tagsResult = await callWorker(process.env.CF_TAGS_URL, tagsPayload);
    const tags =
      Array.isArray(tagsResult.output) ? tagsResult.output.map(t => t.trim()) :
      (tagsResult.tags || []);

    // -- Save AI caption/tags to dog_memories
    await updateDogMemory(supabase, photo.id, {
      ai_caption,
      tags
    });

    // -- Save to walkReport.photos JSONB
    finalizedPhotos.push({
      id: photo.id,
      url: photo.image_url,
      ai_caption,
      tags,
      dog_ids: photo.dog_ids
    });
  }

  // 4. (Optional) Generate a walk summary/story using all data
  // const summaryPayload = {
  //   dog_ids: dogIds,
  //   personalities: personalitySummaries,
  //   photos: finalizedPhotos,
  //   events: report.events || []
  // };
  // const summaryResult = await callWorker(process.env.CF_SUMMARY_URL, summaryPayload);
  // const ai_story_json = summaryResult && summaryResult.story ? summaryResult.story : null;
  const ai_story_json = null; // Placeholder until you wire up your summary worker

  // 5. Update the walk report with the new data
  const updated = await updateWalkReport(supabase, reportId, {
    photos: finalizedPhotos,
    ai_story_json,
    updated_at: new Date().toISOString(),
  });

  return updated;
}

// Dummy function (implement for your schema)
async function getMostRecentEmbeddingIdForDog(supabase, dogId) {
  // Should return the most recent embedding_id for a given dog
  // (e.g., query chat_messages where dog_id = dogId and embedding_id IS NOT NULL order by created_at desc)
  return null;
}
