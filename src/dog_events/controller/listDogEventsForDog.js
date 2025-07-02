import { listDogEventsForDog } from '../service/dogEventService.js';

export async function listDogEventsForDogController(request, reply) {
  try {
    const dog_id = request.params.dog_id;
    const events = await listDogEventsForDog(dog_id);
    return reply.send(events);
  } catch (error) {
    return reply.code(400).send({ error: error.message });
  }
}
