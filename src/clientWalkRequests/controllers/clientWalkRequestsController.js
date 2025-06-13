// src/clientWalkRequests/controllers/clientWalkRequestsController.js

import {
  listClientWalkRequests,
  getClientWalkRequest,
  createClientWalkRequest,
  updateClientWalkRequest,
  deleteClientWalkRequest
} from '../services/clientWalkRequestsService.js';
import { previewPrice } from '../../pricingRules/services/pricingEngine.js';

// Helper: get user ID from JWT
function getUserId(request) {
  return request.user.id ?? request.user.sub;
}

// Helper: validate time strings are in correct order (e.g. "09:00" < "13:00")
function validateTimeWindow(start, end) {
  // Handles "HH:MM" or "HH:MM:SS"
  const pad = s => s.length === 5 ? s + ':00' : s;
  const startT = pad(start);
  const endT = pad(end);
  return startT < endT;
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

  // Logging
  console.log('--- Creating Client Walk Request ---');
  console.log('JWT payload (request.user):', request.user);
  console.log('Resolved userId:', userId);
  console.log('Original request body:', request.body);

  let { walk_date, window_start, window_end, dog_ids, walk_length_minutes } = request.body;

  // Check for required fields
  if (!walk_date || !window_start || !window_end || !Array.isArray(dog_ids) || !dog_ids.length || !walk_length_minutes) {
    return reply.code(400).send({ error: 'Missing required fields.' });
  }

  // Validate time window order
  if (!validateTimeWindow(window_start, window_end)) {
    return reply.code(400).send({ error: 'window_start must be before window_end.' });
  }

  // --- Determine tenant_id ---
  let tenant_id = null;
  const userRole = request.user?.role;

  if (userRole === 'tenant_admin' || userRole === 'tenant') {
    tenant_id = request.user.tenant_id;
    console.log('Resolved tenant_id from JWT (tenant):', tenant_id);
  } else {
    // Lookup the "accepted" tenant for this client
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

  // Compose payload for insert
  const payload = { user_id: userId, tenant_id, walk_date, window_start, window_end, dog_ids, walk_length_minutes };

  // 1. Insert client_walk_request + service_dogs
  let walk_request, pending_service, price_preview;
  try {
    // Create walk request and link dogs
    const result = await createClientWalkRequest(request.server, payload);
    walk_request = result.walk_request;

    // Build preview context to match walk_windows
    const previewContext = {
      tenant_id,
      dog_ids,
      walk_length_minutes,
      window_start,
      window_end,
      walk_date
    };

    // 2. Calculate price preview with service_type: 'walk_window'
    price_preview = await previewPrice(request.server, 'walk_window', previewContext);

    // 3. Insert pending_services (do not store price_preview!)
    const pendingInsert = {
      user_id: userId,
      tenant_id,
      service_date: walk_date,
      service_type: 'walk_window',
      request_id: walk_request.id,
      dog_ids,
      details: {
        window_start,
        window_end,
        walk_length_minutes
      },
      is_confirmed: false,
      created_at: new Date().toISOString()
    };
    const { data: pendingServiceRows, error: pendingError } = await request.server.supabase
      .from('pending_services')
      .insert([pendingInsert])
      .select('*');
    if (pendingError) throw pendingError;
    pending_service = pendingServiceRows?.[0] || {};

  } catch (e) {
    return reply.code(400).send({ error: e.message || e });
  }

  // Hydrate pending_service response with price_preview (not persisted)
  const pending_service_hydrated = pending_service
    ? { ...pending_service, price_preview }
    : {};

  // --- Send response
  reply.code(201).send({
    request: {
      ...walk_request,
      dog_ids: dog_ids || [],
    },
    pending_service: pending_service_hydrated
  });
}

export async function updateRequest(request, reply) {
  const userId = getUserId(request);
  const { id } = request.params;
  const payload = request.body;

  // Validate update fields (optional: add stricter logic if desired)
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
