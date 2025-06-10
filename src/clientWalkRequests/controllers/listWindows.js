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

export default async function listWindows(request, reply) {
  const userId = getUserId(request);
  console.log('[DEBUG:listWindows] request.user:', request.user, '| derived userId:', userId);

  const { week_start } = request.query;

  let windows;
  if (week_start) {
    windows = await listWindowsForWeek(request.server, userId, week_start);
  } else {
    windows = await listClientWalkWindows(request.server, userId);
  }

  // Only pass fields needed by the rule!
  const windowsWithPrice = await Promise.all(
    windows.map(async (w) => {
      let price_preview = null;
      if (w && w.tenant_id) {
        price_preview = await previewPrice(request.server, 'walk_window', {
          tenant_id: w.tenant_id,
          walk_length_minutes: w.walk_length_minutes,
          dog_ids: w.dog_ids || []
        });
      }
      return { ...w, price_preview };
    })
  );

  reply.send({ windows: windowsWithPrice });
}
