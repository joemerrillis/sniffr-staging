// src/walk_reports/service/generateWalkReport.js

import fetch from 'node-fetch';
import {
  getWalkReportById,
  updateWalkReport,
  getDogMemoryById,
  updateDogMemory
} from './walkReportService.js';

// Logging helper for clarity
function logOrchestrator(step, data) {
  console.log(`[Orchestrator] ${step}:`, JSON.stringify(data, null, 2));
}

async function callWorker(url, payload) {
  logOrchestrator(`Calling worker at ${url}`, payload);
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const out = await res.json();
  logOrchestrator(`Response from worker at ${url}`, out);
  if (!res.ok) {
    throw new Error(`Worker at ${url} error: ${JSON.stringify(out)}`);
  }
  return out;
}

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

export async function generateWalkReport(supabase, reportId) {
  const report = await getWalkReportById(supabase, reportId);
  if (!report) throw new Error('Walk report not found');
  const dogIds = report.dog_ids || [];
  const photoRefs = report.photos || [];
  const photoIds = photoRefs.map(p => (typeof p === "string" ? p : p.id));
  const photos = await Promise.all(photoIds.map(id => getDogMemoryById(supabase, id)));

  // 1. For each dog, get a personality profile
  const personalitySummaries = {};
  for (const dogId of dogIds) {
    const embedding_id = await getMostRecentEmbeddingIdForDog(supabase, dogId);
    logOrchestrator("Most recent embedding_id for dog", { dogId, embedding_id });
    if (!embedding_id) {
      personalitySummaries[dogId] = "";
      continue;
    }
    const workerResult = await callWorker(process.env.CF_PERSONALITY_URL, { dog_id: dogId, embedding_id });
    personalitySummaries[dogId] = workerResult.personalitySummary || "";
    logOrchestrator("Personality summary for dog", { dogId, personalitySummary: personalitySummaries[dogId] });
  }

  // 2. For each photo, generate captions/tags
  const finalizedPhotos = [];
  for (const photo of photos) {
    if (!photo) continue;
    const dog_id = (photo.dog_ids && photo.dog_ids[0]) || null;
    const dogNames = photo.dog_ids || [];
    const personalitySummary = dog_id ? personalitySummaries[dog_id] : "";

    logOrchestrator("Preparing to call caption worker", {
      image_url: photo.image_url,
      dog_names: dogNames,
      event_type: 'walk',
      personalitySummary
    });

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
    logOrchestrator("Preparing to call tags worker", tagsPayload);

    const tagsResult = await callWorker(process.env.CF_TAGS_URL, tagsPayload);
    const tags =
      Array.isArray(tagsResult.output) ? tagsResult.output.map(t => t.trim()) :
      (tagsResult.tags || []);

    await updateDogMemory(supabase, photo.id, {
      ai_caption,
      tags
    });

    finalizedPhotos.push({
      id: photo.id,
      url: photo.image_url,
      ai_caption,
      tags,
      dog_ids: photo.dog_ids
    });
  }

  // (Optional) Add logs for summary if you build that worker
  const ai_story_json = null;

  const updated = await updateWalkReport(supabase, reportId, {
    photos: finalizedPhotos,
    ai_story_json,
    updated_at: new Date().toISOString(),
  });

  logOrchestrator("Updated walk report after AI", updated);
  return updated;
}
