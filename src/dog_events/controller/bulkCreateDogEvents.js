import { bulkCreateDogEvents } from '../service/dogEventService.js';

export async function bulkCreateDogEventsController(request, reply) {
  try {
    const created = await bulkCreateDogEvents(request.body.events);
    return reply.code(201).send({ created });
  } catch (error) {
    return reply.code(400).send({ error: error.message });
  }
}
