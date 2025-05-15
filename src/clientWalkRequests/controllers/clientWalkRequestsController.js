// src/clientWalkRequests/controllers/clientWalkRequestsController.js
import {
  listClientWalkRequests,
  getClientWalkRequest,
  createClientWalkRequest,
  updateClientWalkRequest,
  deleteClientWalkRequest
} from '../services/clientWalkRequestsService.js';

function getUserId(request) {
  return request.user.id ?? request.user.sub;
}

export async function listRequests(request, reply) {
  const userId = getUserId(request);
  const requests = await listClientWalkRequests(request.server, userId);
  reply.send({ requests });
}

export async function getRequest(request, reply) {
  const userId = getUserId(request);
  const { id } = request.params;
  const req = await getClientWalkRequest(request.server, userId, id);
  if (!req) return reply.code(404).send({ error: 'Request not found' });
  reply.send({ request: req });
}

export async function createRequest(request, reply) {
  const userId = getUserId(request);
  const { walk_date, window_start, window_end } = request.body;
  const payload = { user_id: userId, walk_date, window_start, window_end };
  const req = await createClientWalkRequest(request.server, payload);
  reply.code(201).send({ request: req });
}

export async function updateRequest(request, reply) {
  const userId = getUserId(request);
  const { id } = request.params;
  const payload = request.body;
  const req = await updateClientWalkRequest(request.server, userId, id, payload);
  if (!req) return reply.code(404).send({ error: 'Request not found' });
  reply.send({ request: req });
}

export async function deleteRequest(request, reply) {
  const userId = getUserId(request);
  const { id } = request.params;
  await deleteClientWalkRequest(request.server, userId, id);
  reply.code(204).send();
}
