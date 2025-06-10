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

export default async function updateWindow(request, reply) {
  const userId = getUserId(request);
  console.log('[DEBUG:updateWindow] request.user:', request.user, '| derived userId:', userId);

  const { id } = request.params;
  const {
    day_of_week,
    window_start,
    window_end,
    effective_start,
    effective_end,
    dog_ids,
    walk_length_minutes
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
  if (walk_length_minutes !== undefined) payload.walk_length_minutes = walk_length_minutes;

  try {
    const { walk_window, service_dogs } = await updateClientWalkWindow(request.server, userId, id, payload);
    if (!walk_window) return reply.code(404).send({ error: 'Window not found' });

    let price_preview = null;
    if (walk_window && walk_window.tenant_id) {
      price_preview = await previewPrice(request.server, 'walk_window', {
        tenant_id: walk_window.tenant_id,
        walk_length_minutes: walk_window.walk_length_minutes,
        dog_ids: walk_window.dog_ids || []
      });
    }

    const walkWindowWithPrice = { ...walk_window, price_preview };

    reply.send({ walk_window: walkWindowWithPrice, service_dogs });
  } catch (e) {
    console.error('[ERROR:updateWindow] exception thrown:', e);
    reply.code(400).send({ error: e.message || e });
  }
}
