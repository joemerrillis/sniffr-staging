import { updateDogEvent } from '../service/dogEventService.js';

export async function updateDogEventController(request, reply) {
  const supabase = request.server.supabase;
  try {
    const id = request.params.id;
    const updates = request.body;
    console.log('[dog_events] Updating dog event:', { id, updates });
    const updated = await updateDogEvent(supabase, id, updates);
    if (!updated) return reply.code(404).send({ error: 'Dog event not found.' });
    return reply.send({ event: updated });
  } catch (error) {
    console.error('[dog_events] Update error:', error);
    return reply.code(500).send({ error: error.message });
  }
}
