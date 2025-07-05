// src/walk_reports/services/walkReportAIService.js

import { getMostRecentEmbeddingIdsForDogs } from '../../chat/services/chatEmbeddingService.js';
import { callPersonalityWorker } from '../../workers/callPersonalityWorker.js';
import { callCaptionWorker } from '../../workers/callCaptionWorker.js';
import { callTagWorker } from '../../workers/callTagWorker.js';

const walkReportsService = {
  async getReportById(supabase, reportId) {
    const { data, error } = await supabase
      .from('walk_reports')
      .select('*')
      .eq('id', reportId)
      .single();
    if (error) throw error;
    return data;
  },

  async updateReport(supabase, reportId, updates) {
    const { data, error } = await supabase
      .from('walk_reports')
      .update(updates)
      .eq('id', reportId)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },

  async getDogMemoryById(supabase, memoryId) {
    const { data, error } = await supabase
      .from('dog_memories')
      .select('*')
      .eq('id', memoryId)
      .single();
    if (error) return null;
    return data;
  },

  async generateReport(supabase, reportId) {
    // 1. Fetch the walk report
    const report = await this.getReportById(supabase, reportId);
    if (!report) throw new Error('Report not found');

    // 2. Gather dog_ids from the report
    const dogIds = report.dog_ids || [];

    // 3. Get the most recent chat embedding_id for each dog
    const embeddingInfos = await getMostRecentEmbeddingIdsForDogs(supabase, dogIds);
    if (!embeddingInfos.length || embeddingInfos.every(e => !e.embedding_id)) {
      throw new Error('No embedded chat with reaction found for any dog in this walk.');
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
      throw new Error('No valid personality profiles generated.');
    }

    // 5. For each photo, call the caption/tag workers using the dog profiles for dogs in the photo
    const photoObjs = [];
    if (Array.isArray(report.photos)) {
      for (const memoryId of report.photos) {
        // Fetch the photo (dog_memories row)
        const photo = await this.getDogMemoryById(supabase, memoryId);
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

    // 6. (Optionally) Generate a story/summary for the walk using all personality profiles and images
    // NOTE: Replace this with your call to walk_summary_worker if you break it out later!
    const ai_story_json = await callPersonalityWorker({
      mode: "story",
      dog_ids: dogIds,
      personality_profiles: personalities.map(p => p.profile),
      images: photoObjs,
    });

    // 7. Save generated captions/tags/summary back to the walk report
    const updatedReport = await this.updateReport(supabase, reportId, {
      photos: photoObjs,
      ai_story_json,
      updated_at: new Date().toISOString(),
    });

    // 8. Return the updated report
    return updatedReport;
  }
};

export default walkReportsService;
