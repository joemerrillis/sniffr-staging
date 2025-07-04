import { listDogEvents } from '../service/dogEventService.js';

export async function listDogEventsController(request, reply) {
  const supabase = request.server.supabase;
  try {
    const filters = request.query || {};
    const events = await listDogEvents(supabase, filters);
    return reply.send({ events });
  } catch (error) {
    console.error('[dog_events] List error:', error);
    return reply.code(500).send({ error: error.message });
  }
}
