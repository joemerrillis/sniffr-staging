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
export default async function listClientWindowsForTenant(request, reply) {
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
