// src/clientWalkRequests/controllers/clientWalkRequestsController.js

import {
  listClientWalkRequests,
  getClientWalkRequest,
  createClientWalkRequest,
  updateClientWalkRequest,
  deleteClientWalkRequest
} from '../services/clientWalkRequestsService.js';

// Get user ID from JWT
function getUserId(request) {
  return request.user.id ?? request.user.sub;
}

// Validate that window_start < window_end ("HH:MM" format)
function validateTimeWindow(start, end) {
  const pad = s => s.length === 5 ? s + ':00' : s;
  return pad(start) < pad(end);
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

  // Extract and validate input
  let { walk_date, window_start, window_end, dog_ids, walk_length_minutes } = request.body;
  if (!walk_date || !window_start || !window_end || !Array.isArray(dog_ids) || !dog_ids.length || !walk_length_minutes) {
    return reply.code(400).send({ error: 'Missing required fields.' });
  }
  if (!validateTimeWindow(window_start, window_end)) {
    return reply.code(400).send({ error: 'window_start must be before window_end.' });
  }

  // Determine tenant_id
  let tenant_id = null;
  const userRole = request.user?.role;
  if (userRole === 'tenant_admin' || userRole === 'tenant') {
    tenant_id = request.user.tenant_id;
  } else {
    const { data: tenantClient } = await request.server.supabase
      .from('tenant_clients')
      .select('tenant_id')
      .eq('user_id', userId)
      .eq('accepted', true)
      .maybeSingle();
    tenant_id = tenantClient?.tenant_id || null;
  }

  // Compose payload for service
  const payload = { user_id: userId, tenant_id, walk_date, window_start, window_end, dog_ids, walk_length_minutes };

  try {
    // Service handles ALL inserts and hydration
    const { walk_request, pending_service } = await createClientWalkRequest(request.server, payload);
    reply.code(201).send({
      request: {
        ...walk_request,
        dog_ids: dog_ids || [],
      },
      pending_service: pending_service || {}
    });
  } catch (e) {
    reply.code(400).send({ error: e.message || e });
  }
}

export async function updateRequest(request, reply) {
  const userId = getUserId(request);
  const { id } = request.params;
  const payload = request.body;
  if (payload.window_start && payload.window_end && !validateTimeWindow(payload.window_start, payload.window_end)) {
    return reply.code(400).send({ error: 'window_start must be before window_end.' });
  }
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
