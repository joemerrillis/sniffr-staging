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

export default async function getWindow(request, reply) {
  const userId = getUserId(request);
  console.log('[DEBUG:getWindow] request.user:', request.user, '| derived userId:', userId);

  const { id } = request.params;
  const window = await getClientWalkWindow(request.server, userId, id);
  if (!window) return reply.code(404).send({ error: 'Window not found' });

  let price_preview = null;
  if (window && window.tenant_id) {
    price_preview = await previewPrice(request.server, 'walk_window', {
      tenant_id: window.tenant_id,
      walk_length_minutes: window.walk_length_minutes,
      dog_ids: window.dog_ids || []
    });
  }

  // Return window with price_preview inside, matching schema
  reply.send({ window: { ...window, price_preview } });
}
