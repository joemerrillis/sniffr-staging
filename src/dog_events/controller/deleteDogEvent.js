import { deleteDogEvent } from '../service/dogEventService.js';

export async function deleteDogEventController(request, reply) {
  const supabase = request.server.supabase;
  try {
    const id = request.params.id;
    const deleted = await deleteDogEvent(supabase, id);
    if (!deleted) return reply.code(404).send({ error: 'Dog event not found.' });
    return reply.send({ deleted: true });
  } catch (error) {
    console.error('[dog_events] Delete error:', error);
    return reply.code(500).send({ error: error.message });
  }
}
