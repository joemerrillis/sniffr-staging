import { validateWalkReportInput } from '../utils/validateWalkReportInput.js';
import { generateAIStory } from '../service/aiStoryService.js';
import { aggregateStats } from '../service/statsAggregator.js';

export async function createWalkReportController(request, reply) {
  const supabase = request.server.supabase;
  try {
    const input = request.body;
    const { walk_id, summary, ai_story_json, stats_json, survey_json, visibility, photos, generate_ai_story } = input;

    // Lookup walk
    const { data: walk, error: walkError } = await supabase
      .from('walks')
      .select('user_id, dog_ids')
      .eq('id', walk_id)
      .single();
    if (walkError || !walk) {
      return reply.code(400).send({ error: 'Invalid walk_id: could not find walk.' });
    }

    // Walker ID
    const walker_id = (request.user && request.user.id) || input.walker_id;
    if (!walker_id) {
      return reply.code(400).send({ error: 'walker_id is required (from auth or payload).' });
    }

    // Validate
    const validation = validateWalkReportInput(input);
    if (!validation.valid) {
      return reply.code(400).send({ error: validation.error });
    }

    // AI/Stats
    let aiStory = ai_story_json;
    let stats = stats_json;
    if (generate_ai_story && photos) {
      aiStory = await generateAIStory(walk.dog_ids[0], photos);
    }
    if (!stats && walk.dog_ids && walk_id) {
      stats = await aggregateStats(supabase, walk_id, walk.dog_ids[0]);
    }

    // Compose row
    const reportData = {
      walk_id,
      user_id: walk.user_id,
      walker_id,
      dog_ids: walk.dog_ids,
      summary: summary || null,
      ai_story_json: aiStory || null,
      stats_json: stats || null,
      survey_json: survey_json || null,
      visibility: visibility || null,
      photos: photos || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Insert, then return first result (don't use .single())
    const { data: rows, error } = await supabase
      .from('walk_reports')
      .insert([reportData])
      .select();

    if (error) {
      return reply.code(500).send({ error: error.message });
    }

    // Return the first (and only) inserted row
    const report = rows && rows[0];
    return reply.code(201).send({ report });
  } catch (error) {
    return reply.code(500).send({ error: error.message, details: error });
  }
}
