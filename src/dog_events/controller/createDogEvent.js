import { createDogEvent } from '../service/dogEventService.js';

export async function createDogEventController(request, reply) {
  const supabase = request.server.supabase;
  try {
    const event = request.body;
    console.log('[dog_events] Creating dog event:', event);
    const created = await createDogEvent(supabase, event);
    return reply.code(201).send({ event: created });
  } catch (error) {
    console.error('[dog_events] Create error:', error);
    return reply.code(500).send({ error: error.message });
  }
}
