// src/walk_reports/service/walkReportAIService.js

import { getMostRecentEmbeddingIdsForDogs } from '../../chat/services/chatEmbeddingService.js';
import {
  callPersonalityWorker,
  callCaptionWorker,
  callTagWorker
} from './workers.js';

import {
  getWalkReportById,
  updateWalkReport,
  getDogMemoryById
} from './walkReportService.js';

const walkReportAIService = {
  async generateReport(supabase, reportId) {
    // 1. Fetch the walk report
    const report = await getWalkReportById(supabase, reportId);
    if (!report) throw new Error('Report not found');

    // 2. Gather dog_ids from the report
    const dogIds = report.dog_ids || [];

    // 3. Get the most recent chat embedding_id for each dog
    const embeddingInfos = await getMostRecentEmbeddingIdsForDogs(supabase, dogIds);
    if (!embeddingInfos.length || embeddingInfos.every(e => !e.embedding_id)) {
      throw new Error('No embedded chat with reaction found for any dog in this walk.');
    }

    // 4. For each dog, call the personality worker (returns summary string)
    const personalities = [];
    for (const { dog_id, embedding_id } of embeddingInfos) {
      if (!embedding_id) continue; // Skip dogs with no embedding
      try {
        const personalitySummary = await callPersonalityWorker(dog_id, embedding_id);
        personalities.push({ dog_id, personalitySummary });
      } catch (err) {
        console.error(`Personality worker failed for dog ${dog_id}:`, err);
      }
    }
    if (!personalities.length) {
      throw new Error('No valid personality profiles generated.');
    }

    // 5. For each photo, call the caption/tag workers using the dog profiles for dogs in the photo
    const photoObjs = [];
    if (Array.isArray(report.photos)) {
      for (const memoryId of report.photos) {
        // Fetch the photo (dog_memories row)
        const photo = await getDogMemoryById(supabase, memoryId);
        if (!photo) continue;

        // Get profiles for all dogs in this photo
        const photoDogProfiles = personalities
          .filter(p => (photo.dog_ids || []).includes(p.dog_id))
          .map(p => p.personalitySummary);

        // Combine all names for this photo (flatten)
        // (If you have getDogNamesFromIds, use it here for real names)
        const dog_names = photo.dog_ids ? photo.dog_ids : [];

        // Pick the first profile for captions/tags (or merge/adjust as needed)
        const primaryProfile = photoDogProfiles[0] || null;

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

    // 6. (Optionally) Generate a story/summary for the walk using all personality profiles and images
    // NOTE: Replace this with a walk_summary_worker if you split out summary logic.
    const ai_story_json = null; // Stub until you have a summary worker

    // 7. Save generated captions/tags/summary back to the walk report
    const updatedReport = await updateWalkReport(supabase, reportId, {
      photos: photoObjs,
      ai_story_json,
      updated_at: new Date().toISOString(),
    });

    // 8. Return the updated report
    return updatedReport;
  }
};

export default walkReportAIService;
