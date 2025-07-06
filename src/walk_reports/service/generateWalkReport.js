// src/walk_reports/service/generateWalkReport.js

import fetch from 'node-fetch';
import {
  getWalkReportById,
  updateWalkReport,
  getDogMemoryById,
  updateDogMemory
} from './walkReportService.js';

// Helper for calling any worker and handling HTTP errors
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

// --- Helper: Find the most recent embedding_id for this dog from chat_messages
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
  // 1. Fetch walk report and all relevant dogs/photos
  const report = await getWalkReportById(supabase, reportId);
  if (!report) throw new Error('Walk report not found');
  const dogIds = Array.from(new Set(report.dog_ids || []));
  const photoRefs = report.photos || [];
  const photoIds = photoRefs.map(p => (typeof p === "string" ? p : p.id));
  const photos = await Promise.all(photoIds.map(id => getDogMemoryById(supabase, id)));

  // 2. For each unique dog, call personality-worker ONCE and store result (sequential, since usually only 1-2 dogs)
  const personalitySummaries = {};
  for (const dogId of dogIds) {
    if (!personalitySummaries[dogId]) {
      const embedding_id = await getMostRecentEmbeddingIdForDog(supabase, dogId);
      console.log(`[Orchestrator] Most recent embedding_id for dog:`, { dogId, embedding_id });
      if (!embedding_id) {
        console.warn(`[Orchestrator] WARNING: No embedding_id found for dog ${dogId}. Skipping personality-worker call for this dog. Using empty profile.`);
        personalitySummaries[dogId] = "";
      } else {
        const workerResult = await callWorker(process.env.CF_PERSONALITY_URL, { dog_id: dogId, embedding_id });
        personalitySummaries[dogId] = workerResult.personalitySummary || "";
      }
    }
  }

  // 3. For each photo, fire caption/tag worker calls in parallel
  const photoJobs = photos.map(async (photo) => {
    const dog_id = (photo.dog_ids && photo.dog_ids[0]) || null;
    const dogNames = photo.dog_ids || [];
    const personalitySummary = dog_id ? personalitySummaries[dog_id] : "";

    // Build payloads
    const captionPayload = {
      image_url: photo.image_url,
      dog_names: dogNames,
      event_type: 'walk',
      meta: {
        dog_ids: photo.dog_ids,
        personalitySummary
      }
    };
    const tagsPayload = {
      image_url: photo.image_url,
      dog_names: dogNames,
      meta: {
        dog_ids: photo.dog_ids,
        personalitySummary
      }
    };

    // Fire off both requests in parallel
    const [captionResult, tagsResult] = await Promise.all([
      callWorker(process.env.CF_CAPTION_URL, captionPayload),
      callWorker(process.env.CF_TAGS_URL, tagsPayload)
    ]);
    const ai_caption =
      Array.isArray(captionResult.output) ? captionResult.output.join(" ").trim() :
      (captionResult.caption || "");
    const tags =
      Array.isArray(tagsResult.output) ? tagsResult.output.map(t => t.trim()) :
      (tagsResult.tags || []);

    // -- Save AI caption/tags to dog_memories
    await updateDogMemory(supabase, photo.id, {
      ai_caption,
      tags
    });

    // -- Save to walkReport.photos JSONB
    return {
      id: photo.id,
      url: photo.image_url,
      ai_caption,
      tags,
      dog_ids: photo.dog_ids
    };
  });

  const finalizedPhotos = await Promise.all(photoJobs);

  // 4. Generate a walk summary/story using all data (calls summary worker)
  let summary = null;
  try {
    const summaryPayload = {
      dog_ids: dogIds,
      personalities: Object.values(personalitySummaries),
      photos: finalizedPhotos,
      events: report.events || []
    };
    const summaryResult = await callWorker(process.env.CF_SUMMARY_URL, summaryPayload);
    summary = summaryResult && summaryResult.summary ? summaryResult.summary : null;
  } catch (err) {
    console.warn("Summary worker failed, continuing without summary:", err);
    summary = null;
  }

  // 5. Update the walk report with the new data
  const updated = await updateWalkReport(supabase, reportId, {
    photos: finalizedPhotos,
    summary,  // Note: now saving to the summary field!
    updated_at: new Date().toISOString(),
  });

  console.log('[Orchestrator] Updated walk report after AI:', JSON.stringify(updated, null, 2));
  return updated;
}
