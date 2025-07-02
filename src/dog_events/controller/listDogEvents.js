import { listDogEvents } from '../service/dogEventService.js';

export async function listDogEventsController(request, reply) {
  try {
    const events = await listDogEvents(request.query);
    return reply.send(events);
  } catch (error) {
    return reply.code(400).send({ error: error.message });
  }
}
