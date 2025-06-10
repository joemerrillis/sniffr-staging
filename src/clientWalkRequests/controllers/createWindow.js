import {{ previewPrice }} from '../../pricingRules/services/pricingEngine.js';
import {{
  listClientWalkWindows,
  getClientWalkWindow,
  createClientWalkWindow,
  updateClientWalkWindow,
  deleteClientWalkWindow,
  listWindowsForWeek,
  seedPendingWalksForWeek
}} from '../services/clientWalkWindowsService.js';
function getUserId(request) {
  return request.user?.id ?? request.user?.sub ?? null;
}

export default async function createWindow(request, reply) {
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
    dog_ids,
    walk_length_minutes
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

  if (typeof walk_length_minutes !== 'number' || walk_length_minutes < 1) {
    return reply
      .code(400)
      .send({ error: 'walk_length_minutes is required and must be a positive integer.' });
  }

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
    dog_ids,
    walk_length_minutes
  };

  try {
    const { walk_window, service_dogs } = await createClientWalkWindow(request.server, payload);

    let price_preview = null;
    if (walk_window && tenant_id) {
      price_preview = await previewPrice(request.server, 'walk_window', {
        tenant_id,
        walk_length_minutes: walk_window.walk_length_minutes,
        dog_ids: walk_window.dog_ids || []
      });
    }

    const walkWindowWithPrice = { ...walk_window, price_preview };

    reply.code(201).send({ walk_window: walkWindowWithPrice, service_dogs });
  } catch (e) {
    console.error('[ERROR:createWindow] exception thrown:', e);
    reply.code(400).send({ error: e.message || e });
  }
}
