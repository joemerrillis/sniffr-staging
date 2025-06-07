import {
  listClientWalkWindows,
  getClientWalkWindow,
  createClientWalkWindow,
  updateClientWalkWindow,
  deleteClientWalkWindow,
  listWindowsForWeek,
  seedPendingWalksForWeek
} from '../services/clientWalkWindowsService.js';

import { previewPrice } from '../../pricingRules/services/pricingEngine.js';

/**
 * Helper to extract the authenticated user's ID from the JWT.
 */
function getUserId(request) {
  return request.user?.id ?? request.user?.sub ?? null;
}

async function listWindows(request, reply) {
  const userId = getUserId(request);
  console.log('[DEBUG:listWindows] request.user:', request.user, '| derived userId:', userId);

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
  console.log('[DEBUG:getWindow] request.user:', request.user, '| derived userId:', userId);

  const { id } = request.params;
  const window = await getClientWalkWindow(request.server, userId, id);
  if (!window) return reply.code(404).send({ error: 'Window not found' });

  let price_preview = null;
  if (window && window.tenant_id) {
    price_preview = await previewPrice(request.server, 'walk_window', {
      ...window,
      tenant_id: window.tenant_id,
      user_id: window.user_id,
      dog_ids: window.dog_ids || []
    });
  }
  reply.send({ window, price_preview });
}

async function createWindow(request, reply) {
  // Robust debug logging
  console.log('[DEBUG:createWindow] request.user:', request.user);
  console.log('[DEBUG:createWindow] request.body:', request.body);

  const userId = getUserId(request);
  console.log('[DEBUG:createWindow] derived userId:', userId);

  const {
    day_of_week,
    window_start,
    window_end,
    effective_start,
    effective_end,
    dog_ids
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

  // ADDED: tenant_id debug path
  let tenant_id = null;
  const userRole = request.user?.role;
  console.log('[DEBUG:createWindow] userRole:', userRole);

  if (userRole === 'tenant_admin' || userRole === 'tenant') {
    tenant_id = request.user.tenant_id;
    console.log('[DEBUG:createWindow] tenant_id from user object:', tenant_id);
  } else {
    const { data: tenantClient, error } = await request.server.supabase
      .from('tenant_clients')
      .select('tenant_id')
      .eq('user_id', userId)
      .eq('accepted', true)
      .maybeSingle();
    tenant_id = tenantClient?.tenant_id || null;
    console.log('[DEBUG:createWindow] tenant_id from tenant_clients:', tenant_id, '| error:', error);
  }

  // Final check: error if userId is missing
  if (!userId) {
    console.error('[ERROR:createWindow] No userId found! request.user:', request.user, '| request.body:', request.body);
    return reply.code(400).send({ error: 'No user_id could be determined from your login session. Are you logged in?' });
  }

  const payload = {
    user_id:        userId,
    tenant_id,
    day_of_week,
    window_start,
    window_end,
    effective_start,
    effective_end,
    dog_ids
  };

  try {
    const { walk_window, service_dogs } = await createClientWalkWindow(request.server, payload);

    let price_preview = null;
    if (walk_window && tenant_id) {
      price_preview = await previewPrice(request.server, 'walk_window', {
        ...walk_window,
        tenant_id,
        user_id: userId,
        dog_ids: walk_window.dog_ids || []
      });
    }

    reply.code(201).send({ walk_window, service_dogs, price_preview });
  } catch (e) {
    console.error('[ERROR:createWindow] exception thrown:', e);
    reply.code(400).send({ error: e.message || e });
  }
}

async function updateWindow(request, reply) {
  const userId = getUserId(request);
  console.log('[DEBUG:updateWindow] request.user:', request.user, '| derived userId:', userId);

  const { id } = request.params;
  const {
    day_of_week,
    window_start,
    window_end,
    effective_start,
    effective_end,
    dog_ids
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
  if (dog_ids         !== undefined) payload.dog_ids         = dog_ids;

  try {
    const { walk_window, service_dogs } = await updateClientWalkWindow(request.server, userId, id, payload);
    if (!walk_window) return reply.code(404).send({ error: 'Window not found' });

    let price_preview = null;
    if (walk_window && walk_window.tenant_id) {
      price_preview = await previewPrice(request.server, 'walk_window', {
        ...walk_window,
        tenant_id: walk_window.tenant_id,
        user_id: walk_window.user_id,
        dog_ids: walk_window.dog_ids || []
      });
    }

    reply.send({ walk_window, service_dogs, price_preview });
  } catch (e) {
    console.error('[ERROR:updateWindow] exception thrown:', e);
    reply.code(400).send({ error: e.message || e });
  }
}

async function deleteWindow(request, reply) {
  const userId = getUserId(request);
  await deleteClientWalkWindow(request.server, userId, id);
  reply.code(204).send();
}

async function seedWalksForCurrentWeek(request, reply) {
  const userId = request.body.user_id || request.user?.id || request.user?.sub;
  console.log('[DEBUG:seedWalksForCurrentWeek] userId:', userId, '| request.user:', request.user);

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
