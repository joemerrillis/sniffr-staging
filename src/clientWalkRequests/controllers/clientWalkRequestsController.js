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

  // LOGGING for transparency
  console.log('--- Creating Client Walk Request ---');
  console.log('JWT payload (request.user):', request.user);
  console.log('Resolved userId:', userId);
  console.log('Original request body:', request.body);

  const { walk_date, window_start, window_end, dog_ids, walk_length_minutes } = request.body;

  // Determine the correct tenant_id
  let tenant_id = null;
  const userRole = request.user?.role;

  if (userRole === 'tenant_admin' || userRole === 'tenant') {
    tenant_id = request.user.tenant_id;
    console.log('Resolved tenant_id from JWT (tenant):', tenant_id);
  } else {
    const { data: tenantClient, error } = await request.server.supabase
      .from('tenant_clients')
      .select('tenant_id')
      .eq('user_id', userId)
      .eq('accepted', true)
      .maybeSingle();

    if (error) {
      console.error('Error looking up tenant for client:', error);
    }
    tenant_id = tenantClient?.tenant_id || null;
    console.log('Resolved tenant_id from tenant_clients:', tenant_id);
  }

  // Compose payload including dog_ids array and walk_length_minutes
  const payload = { user_id: userId, tenant_id, walk_date, window_start, window_end, dog_ids, walk_length_minutes };

  // LOG what will be sent to the service
  console.log('Final payload sent to service:', payload);

  try {
    // Service now returns: { walk_request, pending_service }
    const { walk_request, pending_service } = await createClientWalkRequest(request.server, payload);
    reply.code(201).send({ request: walk_request, pending_service });
  } catch (e) {
    // Will catch both validation and Supabase errors
    reply.code(400).send({ error: e.message || e });
  }
}

export async function updateRequest(request, reply) {
  const userId = getUserId(request);
  const { id } = request.params;
  const payload = request.body;

  // Logging
  console.log('--- Updating Client Walk Request ---');
  console.log('JWT payload (request.user):', request.user);
  console.log('Resolved userId:', userId);
  console.log('Request params:', request.params);
  console.log('Update payload:', payload);

  const req = await updateClientWalkRequest(request.server, userId, id, payload);
  if (!req) return reply.code(404).send({ error: 'Request not found' });
  reply.send({ request: req });
}

export async function deleteRequest(request, reply) {
  const userId = getUserId(request);
  const { id } = request.params;

  // Logging
  console.log('--- Deleting Client Walk Request ---');
  console.log('JWT payload (request.user):', request.user);
  console.log('Resolved userId:', userId);
  console.log('Request params:', request.params);

  await deleteClientWalkRequest(request.server, userId, id);
  reply.code(204).send();
}
