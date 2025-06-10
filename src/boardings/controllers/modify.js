import getUserId from './getUserId.js';
import getTenantConfig from './getTenantConfig.js';
import validateBlockTimeFields from './validateBlockTimeFields.js';
import { getBoarding, updateBoarding } from '../services/boardingsService.js';
import { previewPrice } from '../../pricingRules/services/pricingEngine.js';

export default async function modify(request, reply) {
  const { id } = request.params;
  const userId = getUserId(request);
  const { tenant_id } = request.body;

  if (tenant_id) {
    let tenant;
    try {
      tenant = await getTenantConfig(request.server, tenant_id);
    } catch (err) {
      return reply.code(400).send({ error: err.message });
    }
    const blockTimeErr = validateBlockTimeFields(tenant, request.body);
    if (blockTimeErr) {
      return reply.code(400).send({ error: blockTimeErr });
    }
  }

  let { dogs } = request.body;
  if (!Array.isArray(dogs) || !dogs.length) {
    const { data: ownedDogs, error: dogErr } = await request.server.supabase
      .from('dog_owners')
      .select('dog_id')
      .eq('user_id', userId);
    if (dogErr) return reply.code(400).send({ error: 'Could not fetch user dogs.' });
    dogs = ownedDogs ? ownedDogs.map(d => d.dog_id) : [];
  }

  const fields = [
    'drop_off_day', 'drop_off_block', 'drop_off_time', 'pick_up_day', 'pick_up_block', 'pick_up_time',
    'status', 'notes', 'proposed_drop_off_time', 'proposed_pick_up_time',
    'proposed_changes', 'booking_id', 'is_draft', 'approved_by', 'approved_at', 'final_price'
  ];
  const payload = {};
  for (const key of fields) {
    if (request.body[key] !== undefined) payload[key] = request.body[key];
  }
  payload.dogs = dogs;

  let breakdown = [];
  try {
    const currentBoarding = await getBoarding(request.server, id);
    const newDropOff = payload.drop_off_day || currentBoarding.drop_off_day;
    const newPickUp = payload.pick_up_day || currentBoarding.pick_up_day;
    const newDogs = payload.dogs || currentBoarding.dogs;

    const priceResult = await previewPrice(
      request.server,
      'boarding',
      {
        tenant_id: tenant_id || currentBoarding.tenant_id,
        drop_off_day: newDropOff,
        pick_up_day: newPickUp,
        dog_ids: newDogs
      }
    );
    if (priceResult.error) {
      request.log.error({ priceResult }, '[Boardings] Pricing engine error (modify)');
      return reply.code(400).send({ error: priceResult.error, missing_fields: priceResult.missing_fields, breakdown: priceResult.breakdown || [] });
    }
    payload.price = priceResult.price;
    breakdown = priceResult.breakdown || [];
  } catch (err) {
    request.log.error({ err }, '[Boardings] Exception during price calculation (modify)');
    return reply.code(500).send({ error: 'Error calculating price.' });
  }

  try {
    const { boarding, service_dogs } = await updateBoarding(request.server, id, payload);
    if (!boarding) return reply.code(404).send({ error: 'Boarding not found' });
    reply.send({ boarding, service_dogs, breakdown });
  } catch (e) {
    reply.code(400).send({ error: e.message || e });
  }
}
