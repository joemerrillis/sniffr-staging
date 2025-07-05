// walk_reports/controllers/walkReportsController.js

import walkReportsService from '../services/walkReportsService.js';
import chatService from '../../chat/services/chatService.js';
import { callWorker } from '../../utils/callWorker.js';

// Other controllers here...

export async function generateWalkReportController(request, reply) {
  const supabase = request.server.supabase;
  const reportId = request.params.id;

  // 1. Fetch the walk report
  const report = await walkReportsService.getReportById(supabase, reportId);
  if (!report) return reply.code(404).send({ error: 'Report not found' });

  // 2. Gather dog_ids and walker_id from the report
  const dogIds = report.dog_ids || [];
  const walkerId = report.walker_id;

  // 3. Get all recent chat messages for this dog that have an embedding_id (i.e., were reacted to)
  // We'll use the latest one for the embedding_id
  const recentEmbeddedChat = await chatService.getMostRecentEmbeddedChatForDog(supabase, dogIds);

  if (!recentEmbeddedChat || !recentEmbeddedChat.embedding_id) {
    return reply.code(400).send({ error: 'No embedded chat with reaction found for this dog.' });
  }

  const embedding_id = recentEmbeddedChat.embedding_id;

  // 4. Call personality_worker with embedding_id and dog_id(s)
  const personalityProfile = await callWorker('personality_worker', {
    embedding_id,
    dog_id: dogIds[0], // Assuming single-dog walk for now; if multi-dog, you can loop later
    dog_ids: dogIds,
    // Optionally pass dog names if you fetch them
  });

  // 5. Get all dog_memories for the report (from report.photos: array of dog_memories IDs)
  const photoObjs = [];
  if (Array.isArray(report.photos)) {
    for (const memoryId of report.photos) {
      // Pull dog_memories record (assuming a service exists, otherwise fetch directly)
      const photo = await walkReportsService.getDogMemoryById(supabase, memoryId);
      if (!photo) continue;

      // Generate caption and tags for each photo using the personality profile
      const caption = await callWorker('caption_worker', {
        image_url: photo.image_url,
        dog_names: personalityProfile?.names || [],
        personality_profile: personalityProfile,
      });

      const tags = await callWorker('tag_worker', {
        image_url: photo.image_url,
        dog_names: personalityProfile?.names || [],
        personality_profile: personalityProfile,
      });

      photoObjs.push({
        url: photo.image_url,
        caption,
        tags,
        dog_ids: photo.dog_ids,
      });
    }
  }

  // 6. Optionally, generate a summary/story for the walk
  const ai_story_json = await callWorker('personality_worker', {
    mode: "story",
    dog_id: dogIds[0],
    dog_ids: dogIds,
    personality_profile: personalityProfile,
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
