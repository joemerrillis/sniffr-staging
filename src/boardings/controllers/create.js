import getUserId from './getUserId.js';
import getTenantConfig from './getTenantConfig.js';
import validateBlockTimeFields from './validateBlockTimeFields.js';
import { createBoarding } from '../services/index.js';
import { previewPrice } from '../../pricingRules/services/pricingEngine.js';

export default async function create(request, reply) {
  const userId = getUserId(request);
  let {
    tenant_id,
    drop_off_day,
    drop_off_block,
    drop_off_time,
    pick_up_day,
    pick_up_block,
    pick_up_time,
    price,
    notes,
    proposed_drop_off_time,
    proposed_pick_up_time,
    proposed_changes,
    booking_id,
    is_draft,
    final_price,
    dogs
  } = request.body;

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

  if (!Array.isArray(dogs) || !dogs.length) {
    const { data: ownedDogs, error: dogErr } = await request.server.supabase
      .from('dog_owners')
      .select('dog_id')
      .eq('user_id', userId);
    if (dogErr) return reply.code(400).send({ error: 'Could not fetch user dogs.' });
    dogs = ownedDogs ? ownedDogs.map(d => d.dog_id) : [];
  }

  let pricingResult = null;
  let breakdown = [];
  if (!price || isNaN(Number(price))) {
    try {
      pricingResult = await previewPrice(request.server, 'boarding', {
        tenant_id,
        drop_off_day,
        pick_up_day,
        dog_ids: dogs
      });
      if (pricingResult.error) {
        return reply.code(400).send({ error: pricingResult.error, breakdown: pricingResult.breakdown || [] });
      }
      price = pricingResult.price;
      breakdown = pricingResult.breakdown || [];
    } catch (err) {
      return reply.code(400).send({ error: 'Failed to compute price', details: err.message });
    }
  }

  const payload = {
    tenant_id,
    user_id: userId,
    drop_off_day,
    drop_off_block,
    drop_off_time,
    pick_up_day,
    pick_up_block,
    pick_up_time,
    price,
    notes,
    proposed_drop_off_time,
    proposed_pick_up_time,
    proposed_changes,
    booking_id,
    is_draft,
    final_price,
    dogs
  };

  try {
    const { boarding, service_dogs } = await createBoarding(request.server, payload);
    reply.code(201).send({ boarding, service_dogs, breakdown });
  } catch (e) {
    reply.code(400).send({ error: e.message || e });
  }
}
