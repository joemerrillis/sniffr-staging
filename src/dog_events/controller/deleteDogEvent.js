import { deleteDogEvent } from '../service/dogEventService.js';

export async function deleteDogEventController(request, reply) {
  try {
    const id = request.params.id;
    const deleted = await deleteDogEvent(id);
    if (!deleted) return reply.code(404).send({ error: 'Dog event not found.' });
    return reply.send({ deleted: true });
  } catch (error) {
    return reply.code(400).send({ error: error.message });
  }
}
