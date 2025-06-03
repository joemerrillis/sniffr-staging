import {
  listClientWalkWindows,
  getClientWalkWindow,
  createClientWalkWindow,
  updateClientWalkWindow,
  deleteClientWalkWindow,
  listWindowsForWeek,
  seedPendingWalksForWeek
} from '../services/clientWalkWindowsService.js';

/**
 * Helper to extract the authenticated user's ID from the JWT.
 */
function getUserId(request) {
  return request.user.id ?? request.user.sub;
}

async function listWindows(request, reply) {
  const userId = getUserId(request);
  const { week_start } = request.query;

  let windows;
  if (week_start) {
    windows = await listWindowsForWeek(request.server, userId, week_start);
  } else {
    windows = await listClientWalkWindows(request.server, userId);
  }

  reply.send({ windows });
}

async function listClientWindowsForTenant(request, reply) {
  const { tenant_id, client_id } = request.params;
  const { week_start } = request.query;

  // Security: check that tenant_id has access to client_id
  const { data: tenantClient, error } = await request.server.supabase
    .from('tenant_clients')
    .select('id')
    .eq('tenant_id', tenant_id)
    .eq('client_id', client_id)
    .eq('accepted', true)
    .single();

  if (error || !tenantClient) {
    return reply.code(404).send({ error: 'Client not found for this tenant.' });
  }

  let windows;
  if (week_start) {
    windows = await listWindowsForWeek(request.server, client_id, week_start);
  } else {
    windows = await listClientWalkWindows(request.server, client_id);
  }

  reply.send({ windows });
}

async function getWindow(request, reply) {
  const userId = getUserId(request);
  const { id } = request.params;
  const window = await getClientWalkWindow(request.server, userId, id);
  if (!window) return reply.code(404).send({ error: 'Window not found' });
  reply.send({ window });
}

// --- CHANGED: createWindow now accepts dog_ids, resolves tenant_id, writes service_dogs ---
async function createWindow(request, reply) {
  const userId = getUserId(request);
  const {
    day_of_week,
    window_start,
    window_end,
    effective_start,
    effective_end,
    dog_ids // <-- ADDED: now support multi-dog creation
  } = request.body;

  if (
    typeof day_of_week !== 'number' ||
    !Number.isInteger(day_of_week) ||
    day_of_week < 0 ||
    day_of_week > 6
  ) {
    return reply
      .code(400)
      .send({ error: 'day_of_week must be an integer 0 (Sunday) through 6 (Saturday)' });
  }

  // -- ADDED: Resolve tenant_id just like in requests controller --
  let tenant_id = null;
  const userRole = request.user?.role;

  if (userRole === 'tenant_admin' || userRole === 'tenant') {
    tenant_id = request.user.tenant_id;
  } else {
    const { data: tenantClient, error } = await request.server.supabase
      .from('tenant_clients')
      .select('tenant_id')
      .eq('user_id', userId)
      .eq('accepted', true)
      .maybeSingle();
    tenant_id = tenantClient?.tenant_id || null;
  }

  const payload = {
    user_id:        userId,
    tenant_id,      // ADDED
    day_of_week,
    window_start,
    window_end,
    effective_start,
    effective_end,
    dog_ids        // ADDED
  };

  // -- ADDED: Service now creates the window, writes service_dogs, and returns both --
  try {
    const { walk_window, service_dogs } = await createClientWalkWindow(request.server, payload);
    reply.code(201).send({ walk_window, service_dogs });
  } catch (e) {
    reply.code(400).send({ error: e.message || e });
  }
}

// --- CHANGED: updateWindow supports updating dog_ids, keeps tenant_id logic ---
async function updateWindow(request, reply) {
  const userId = getUserId(request);
  const { id } = request.params;
  const {
    day_of_week,
    window_start,
    window_end,
    effective_start,
    effective_end,
    dog_ids // ADDED
  } = request.body;

  const payload = {};
  if (day_of_week !== undefined) {
    if (
      typeof day_of_week !== 'number' ||
      !Number.isInteger(day_of_week) ||
      day_of_week < 0 ||
      day_of_week > 6
    ) {
      return reply
        .code(400)
        .send({ error: 'day_of_week must be an integer 0 (Sunday) through 6 (Saturday)' });
    }
    payload.day_of_week = day_of_week;
  }
  if (window_start    !== undefined) payload.window_start    = window_start;
  if (window_end      !== undefined) payload.window_end      = window_end;
  if (effective_start !== undefined) payload.effective_start = effective_start;
  if (effective_end   !== undefined) payload.effective_end   = effective_end;
  if (dog_ids         !== undefined) payload.dog_ids         = dog_ids; // ADDED

  // -- ADDED: update service_dogs to match any new dog_ids array --
  try {
    const { walk_window, service_dogs } = await updateClientWalkWindow(request.server, userId, id, payload);
    if (!walk_window) return reply.code(404).send({ error: 'Window not found' });
    reply.send({ walk_window, service_dogs });
  } catch (e) {
    reply.code(400).send({ error: e.message || e });
  }
}

async function deleteWindow(request, reply) {
  const userId = getUserId(request);
  const { id } = request.params;
  await deleteClientWalkWindow(request.server, userId, id);
  reply.code(204).send();
}

// No change: seeding is still allowed, but will now always read up-to-date window/dog associations
async function seedWalksForCurrentWeek(request, reply) {
  const userId = request.body.user_id || request.user.id || request.user.sub;
  const today = new Date();
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (6 - today.getDay()));

  const seededCount = await seedPendingWalksForWeek(request.server, userId, today, endOfWeek);
  reply.send({ seeded: seededCount });
}

export {
  listWindows,
  listClientWindowsForTenant,
  getWindow,
  createWindow,
  updateWindow,
  deleteWindow,
  seedWalksForCurrentWeek
};
