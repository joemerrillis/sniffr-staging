// src/daycare_sessions/services/createDaycareSession.js
import needsApproval from '../helpers/needsApproval.js';
import { previewPrice } from '../../pricingRules/services/pricingEngine.js';

export default async function createDaycareSession(server, payload) {
  const { tenant_id, user_id, dog_ids, session_date, ...rest } = payload;

  // 1. Price preview
  const pricingResult = await previewPrice(server, 'daycare', {
    tenant_id,
    session_date,
    dog_ids
  });

  if (pricingResult.error) {
    throw new Error(pricingResult.error);
  }
  const price = pricingResult.price;
  const breakdown = pricingResult.breakdown || [];

  // 2. Approval logic
  const requiresApproval = await needsApproval(server, tenant_id, dog_ids, session_date);

  // 3. Insert daycare session
  const { data, error } = await server.supabase
    .from('daycare_sessions')
    .insert({
      tenant_id,
      user_id,
      dog_ids,
      session_date,
      price,
      status: requiresApproval ? 'pending_approval' : 'approved',
      ...rest
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);

  // 4. Insert pending_services if not requiring approval
  let pending_service = null;
  if (!requiresApproval) {
    const { data: ps, error: psErr } = await server.supabase
      .from('pending_services')
      .insert({
        user_id,
        tenant_id,
        service_date: session_date,
        service_type: 'daycare',
        daycare_request_id: data.id,
        dog_ids,
        details: { session_date },
        is_confirmed: false,
        created_at: new Date().toISOString()
      })
      .select('*')
      .single();
    if (psErr) {
      console.error('[DaycareCreate] Error inserting pending_service:', psErr);
    }
    pending_service = ps;
  }

  return { daycare_session: data, pending_service, breakdown, requiresApproval };
}
