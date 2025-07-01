import { createWalkReport } from '../service/walkReportService.js';
import { generateAIStory } from '../service/aiStoryService.js';
import { aggregateStats } from '../service/statsAggregator.js';
import { validateWalkReportInput } from '../utils/validateWalkReportInput.js';

export async function createWalkReportController(request, reply) {
  try {
    const input = request.body;

    const validation = validateWalkReportInput(input);
    if (!validation.valid) {
      return reply.code(400).send({ error: validation.error });
    }

    // Optionally trigger AI story/captions and stats aggregation
    let ai_story_json = input.ai_story_json;
    let stats_json = input.stats_json;

    if (input.generate_ai_story && input.photos) {
      ai_story_json = await generateAIStory(input.dog_id, input.photos);
    }
    if (!stats_json && input.dog_id && input.walk_id) {
      stats_json = await aggregateStats(input.walk_id, input.dog_id);
    }

    const newReport = await createWalkReport({
      ...input,
      ai_story_json,
      stats_json,
    });

    return reply.code(201).send(newReport);
  } catch (error) {
    return reply.code(500).send({ error: error.message });
  }
}
