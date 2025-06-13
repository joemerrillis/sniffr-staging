// controllers/clientWalkRequests/create.js
import getUserId from './getUserId.js';
import validateTimeWindow from './validateTimeWindow.js';
import { orchestrateCreateClientWalkRequest } from '../services/createClientWalkRequest.js';

export default async function create(request, reply) {
  const userId = getUserId(request);
  let { walk_date, window_start, window_end, dog_ids, walk_length_minutes } = request.body;

  // Required field check
  if (!walk_date || !window_start || !window_end || !Array.isArray(dog_ids) || !dog_ids.length || !walk_length_minutes)
    return reply.code(400).send({ error: 'Missing required fields.' });

  if (!validateTimeWindow(window_start, window_end))
    return reply.code(400).send({ error: 'window_start must be before window_end.' });

  try {
    const result = await orchestrateCreateClientWalkRequest(request, {
      walk_date, window_start, window_end, dog_ids, walk_length_minutes, user_id: userId
    });
    reply.code(201).send(result);
  } catch (e) {
    reply.code(400).send({ error: e.message || e });
  }
}
