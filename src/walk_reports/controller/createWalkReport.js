import { validateWalkReportInput } from '../utils/validateWalkReportInput.js';
import { generateAIStory } from '../service/aiStoryService.js';
import { aggregateStats } from '../service/statsAggregator.js';

export async function createWalkReportController(request, reply) {
  const supabase = request.server.supabase;
  try {
    const input = request.body;
    const { walk_id, summary, ai_story_json, stats_json, survey_json, visibility, photos, generate_ai_story } = input;

    // --- 1. Lookup walk to get user_id (owner) and dog_ids ---
    const { data: walk, error: walkError } = await supabase
      .from('walks')
      .select('user_id, dog_ids')
      .eq('id', walk_id)
      .single();
    if (walkError || !walk) {
      return reply.code(400).send({ error: 'Invalid walk_id: could not find walk.' });
    }

    // --- 2. Get current walker_id (from session/auth, or pass in payload for now) ---
    // Ideally, walker_id should be request.user.id if you use JWT auth
    // Fallback to input.walker_id for now if needed
    const walker_id = (request.user && request.user.id) || input.walker_id;
    if (!walker_id) {
      return reply.code(400).send({ error: 'walker_id is required (from auth or payload).' });
    }

    // --- 3. Validate payload (skip dog_id/client_id checks, enforce walk_id/walker_id) ---
    const validation = validateWalkReportInput(input); // Update this util if needed!
    if (!validation.valid) {
      return reply.code(400).send({ error: validation.error });
    }

    // --- 4. AI/Stats: Generate as needed ---
    let aiStory = ai_story_json;
    let stats = stats_json;

    if (generate_ai_story && photos) {
      aiStory = await generateAIStory(walk.dog_ids[0], photos); // pick 1st dog, or update as needed
    }
    if (!stats && walk.dog_ids && walk_id) {
      // Optionally: aggregate stats for all dogs, or just first
      stats = await aggregateStats(supabase, walk_id, walk.dog_ids[0]);
    }

    // --- 5. Build final data object ---
    const reportData = {
      walk_id,
      user_id: walk.user_id,      // Owner/client (from walks)
      walker_id,                  // Walker
      dog_ids: walk.dog_ids,      // Dogs in the walk
      summary: summary || null,
      ai_story_json: aiStory || null,
      stats_json: stats || null,
      survey_json: survey_json || null,
      visibility: visibility || null,
      photos: photos || null,
      created_at: new Date().toISOString(), // optional
      updated_at: new Date().toISOString()
    };

    // --- 6. Insert report ---
    const { data, error } = await supabase
      .from('walk_reports')
      .insert([reportData])
      .select()
      .single();

    if (error) {
      return reply.code(500).send({ error: error.message });
    }

    return reply.code(201).send({ report: data });
  } catch (error) {
    return reply.code(500).send({ error: error.message, details: error });
  }
}
