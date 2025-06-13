// controllers/clientWalkRequests/update.js
import getUserId from './getUserId.js';
import validateTimeWindow from './validateTimeWindow.js';
import { updateClientWalkRequest } from '../services/updateClientWalkRequest.js';

export default async function update(request, reply) {
  const userId = getUserId(request);
  const { id } = request.params;
  const { window_start, window_end } = request.body;

  if (window_start && window_end && !validateTimeWindow(window_start, window_end))
    return reply.code(400).send({ error: 'window_start must be before window_end.' });

  const req = await updateClientWalkRequest(request.server, userId, id, request.body);
  if (!req) return reply.code(404).send({ error: 'Request not found' });
  reply.send({ request: req });
}
