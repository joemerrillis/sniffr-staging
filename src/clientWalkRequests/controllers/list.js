// controllers/clientWalkRequests/list.js
import getUserId from './getUserId.js';
import { listClientWalkRequests } from '../services/listClientWalkRequests.js';

export default async function list(request, reply) {
  const userId = getUserId(request);
  const requests = await listClientWalkRequests(request.server, userId);
  reply.send({ requests });
}
