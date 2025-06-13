import getUserId from './getUserId.js';
import validateTimeWindow from './validateTimeWindow.js';
import createClientWalkRequest from '../services/createClientWalkRequest.js';

async function getTenantId(server, request, userId) {
  const userRole = request.user?.role;
  if (userRole === 'tenant_admin' || userRole === 'tenant') {
    return request.user.tenant_id;
  }
  // Otherwise look up tenant_clients
  const { data: tenantClient, error } = await server.supabase
    .from('tenant_clients')
    .select('tenant_id')
    .eq('user_id', userId)
    .eq('accepted', true)
    .maybeSingle();
  return tenantClient?.tenant_id || null;
}

export default async function create(request, reply) {
  const userId = getUserId(request);
  let { walk_date, window_start, window_end, dog_ids, walk_length_minutes } = request.body;

  if (!walk_date || !window_start || !window_end || !Array.isArray(dog_ids) || !dog_ids.length || !walk_length_minutes)
    return reply.code(400).send({ error: 'Missing required fields.' });

  if (!validateTimeWindow(window_start, window_end))
    return reply.code(400).send({ error: 'window_start must be before window_end.' });

  // --- FIX: Get tenant_id ---
  let tenant_id = await getTenantId(request.server, request, userId);
  if (!tenant_id) {
    return reply.code(400).send({ error: 'Could not determine tenant_id for user.' });
  }

  try {
    const result = await createClientWalkRequest(request.server, {
      walk_date,
      window_start,
      window_end,
      dog_ids,
      walk_length_minutes,
      user_id: userId,
      tenant_id  // <-- pass tenant_id
    });
    reply.code(201).send(result);
  } catch (e) {
    reply.code(400).send({ error: e.message || e });
  }
}
