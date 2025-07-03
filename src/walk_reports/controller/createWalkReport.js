import { validateWalkReportInput } from '../utils/validateWalkReportInput.js';
import { generateAIStory } from '../service/aiStoryService.js';     // <-- your AI worker interface
import { aggregateStats } from '../service/statsAggregator.js';

export async function createWalkReportController(request, reply) {
  export async function createWalkReportController(request, reply) {
  console.log('[walk_reports] typeof request.server.supabase:', typeof request.server.supabase);
  console.log('[walk_reports] request.server.supabase:', request.server.supabase);
  console.log('[walk_reports] request.server.supabase.from:', request.server.supabase?.from);
  // ...rest of function


  const supabase = request.server.supabase;
  try {
    const input = request.body;

    // Step 1: Validate input
    const validation = validateWalkReportInput(input);
    if (!validation.valid) {
      return reply.code(400).send({ error: validation.error });
    }

    // Step 2: Optionally run AI worker to caption photos and stats
    let ai_story_json = input.ai_story_json;
    let stats_json = input.stats_json;

    // --- AI WORKER STUB: Generate story captions if requested ---
    if (input.generate_ai_story && input.photos) {
      // This is where you call your actual Cloudflare Worker (or local wrapper)
      ai_story_json = await generateAIStory(input.dog_id, input.photos);
    }

    // --- AI WORKER STUB: Aggregate stats (optional) ---
    if (!stats_json && input.dog_id && input.walk_id) {
      stats_json = await aggregateStats(input.walk_id, input.dog_id);
    }

    // Step 3: Write to DB
    const { data, error } = await supabase
      .from('walk_reports')
      .insert([{ ...input, ai_story_json, stats_json }])
      .select()
      .single();

    if (error) return reply.code(500).send({ error: error.message });
    return reply.code(201).send({ report: data });
  } catch (error) {
    return reply.code(500).send({ error: error.message });
  }
}
