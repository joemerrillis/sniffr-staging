import { updateDogEvent } from '../service/dogEventService.js';

export async function updateDogEventController(request, reply) {
  try {
    const id = request.params.id;
    const updated = await updateDogEvent(id, request.body);
    if (!updated) return reply.code(404).send({ error: 'Dog event not found.' });
    return reply.send(updated);
  } catch (error) {
    return reply.code(400).send({ error: error.message });
  }
}
