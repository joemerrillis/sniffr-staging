import { createDogEvent } from '../service/dogEventService.js';

export async function createDogEventController(request, reply) {
  try {
    const event = await createDogEvent(request.body);
    return reply.code(201).send(event);
  } catch (error) {
    return reply.code(400).send({ error: error.message });
  }
}
