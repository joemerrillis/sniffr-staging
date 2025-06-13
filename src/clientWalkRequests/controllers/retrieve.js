// controllers/clientWalkRequests/retrieve.js
import getUserId from './getUserId.js';
import { getClientWalkRequest } from '../services/getClientWalkRequest.js';

export default async function retrieve(request, reply) {
  const userId = getUserId(request);
  const { id } = request.params;
  const req = await getClientWalkRequest(request.server, userId, id);
  if (!req) return reply.code(404).send({ error: 'Request not found' });
  reply.send({ request: req });
}
