import { listDogEventsForDog } from '../service/dogEventService.js';

export async function listDogEventsForDogController(request, reply) {
  const supabase = request.server.supabase;
  try {
    const dog_id = request.params.dog_id;
    const events = await listDogEventsForDog(supabase, dog_id);
    return reply.send({ events });
  } catch (error) {
    console.error('[dog_events] List for dog error:', error);
    return reply.code(500).send({ error: error.message });
  }
}
