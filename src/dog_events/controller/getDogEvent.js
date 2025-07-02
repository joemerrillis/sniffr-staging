import { getDogEventById } from '../service/dogEventService.js';

export async function getDogEventController(request, reply) {
  try {
    const id = request.params.id;
    const event = await getDogEventById(id);
    if (!event) return reply.code(404).send({ error: 'Dog event not found.' });
    return reply.send(event);
  } catch (error) {
    return reply.code(400).send({ error: error.message });
  }
}
