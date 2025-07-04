import { getDogEventById } from '../service/dogEventService.js';

export async function getDogEventController(request, reply) {
  const supabase = request.server.supabase;
  try {
    const id = request.params.id;
    const event = await getDogEventById(supabase, id);
    if (!event) return reply.code(404).send({ error: 'Dog event not found.' });
    return reply.send({ event });
  } catch (error) {
    console.error('[dog_events] Get error:', error);
    return reply.code(500).send({ error: error.message });
  }
}
