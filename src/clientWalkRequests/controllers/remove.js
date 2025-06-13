// controllers/clientWalkRequests/remove.js
import getUserId from './getUserId.js';
import { deleteClientWalkRequest } from '../services/deleteClientWalkRequest.js';

export default async function remove(request, reply) {
  const userId = getUserId(request);
  const { id } = request.params;
  await deleteClientWalkRequest(request.server, userId, id);
  reply.code(204).send();
}
