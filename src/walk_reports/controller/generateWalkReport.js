// src/walk_reports/controller/generateWalkReportController.js

import walkReportsService from '../services/walkReportsService.js';
import { getMostRecentEmbeddingIdsForDogs } from '../../chat/services/chatEmbeddingService.js';
import { callPersonalityWorker } from '../../workers/callPersonalityWorker.js';
import { callCaptionWorker } from '../../workers/callCaptionWorker.js';
import { callTagWorker } from '../../workers/callTagWorker.js';

export async function generateWalkReportController(request, reply) {
  const supabase = request.server.supabase;
  const reportId = request.params.id;

  // 1. Fetch the walk report
  const report = await walkReportsService.getReportById(supabase, reportId);
  if (!report) return reply.code(404).send({ error: 'Report not found' });

  // 2. Gather dog_ids from the report
  const dogIds = report.dog_ids || [];

  // 3. Get the most recent chat embedding_id for each dog in the walk
  const embeddingInfos = await getMostRecentEmbeddingIdsForDogs(supabase, dogIds);
  if (!embeddingInfos.length || embeddingInfos.every(e => !e.embedding_id)) {
    return reply.code(400).send({ error: 'No embedded chat with reaction found for any dog in this walk.' });
  }

  // 4. For each dog, call the personality worker
  const personalities = [];
  for (const { dog_id, embedding_id } of embeddingInfos) {
    if (!embedding_id) continue; // Skip dogs with no embedding
    try {
      const profile = await callPersonalityWorker({
        embedding_id,
        dog_id,
        dog_ids: [dog_id]
      });
      personalities.push({ dog_id, profile });
    } catch (err) {
      console.error(`Personality worker failed for dog ${dog_id}:`, err);
    }
  }
  if (!personalities.length) {
    return reply.code(400).send({ error: 'No valid personality profiles generated.' });
  }

  // 5. For each photo, call the caption/tag workers using the dog profiles for dogs in the photo
  const photoObjs = [];
  if (Array.isArray(report.photos)) {
    for (const memoryId of report.photos) {
      // Fetch the photo (dog_memories row)
      const photo = await walkReportsService.getDogMemoryById(supabase, memoryId);
      if (!photo) continue;

      // Get profiles for all dogs in this photo
      const photoDogProfiles = personalities
        .filter(p => (photo.dog_ids || []).includes(p.dog_id))
        .map(p => p.profile);

      // Combine all names for this photo (flatten)
      const dog_names = photoDogProfiles.map(p => p.names).flat();

      // Pick the first profile for captions/tags (or improve to combine if you want)
      const primaryProfile = photoDogProfiles[0] || {};

      // Call caption worker
      const caption = await callCaptionWorker(
        photo,
        dog_names,
        null, // eventType, if you have it
        primaryProfile
      );

      // Call tag worker
      const tags = await callTagWorker(
        photo,
        dog_names,
        null, // eventType, if you have it
        primaryProfile
      );

      photoObjs.push({
        url: photo.image_url,
        caption,
        tags,
        dog_ids: photo.dog_ids,
      });
    }
  }

  // 6. Generate a story/summary for the walk using all personality profiles and images
  const ai_story_json = await callPersonalityWorker({
    mode: "story",
    dog_ids: dogIds,
    personality_profiles: personalities.map(p => p.profile),
    images: photoObjs,
  });

  // 7. Save generated captions/tags/summary back to the walk report
  const updatedReport = await walkReportsService.updateReport(supabase, reportId, {
    photos: photoObjs,
    ai_story_json,
    updated_at: new Date().toISOString(),
  });

  // 8. Return in envelope format
  return reply.send({ report: updatedReport });
}
