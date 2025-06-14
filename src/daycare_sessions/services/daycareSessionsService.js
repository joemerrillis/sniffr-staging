import supabase from '../../core/supabase.js';
import needsApproval from '../helpers/needsApproval.js'; // <== Add this helper file!
import { previewPrice } from '../../pricingRules/services/pricingEngine.js';

export async function listDaycareSessions(filters = {}) {
  let query = supabase.from('daycare_sessions').select('*');
  if (filters.tenant_id) query = query.eq('tenant_id', filters.tenant_id);
  if (filters.dog_id) query = query.eq('dog_id', filters.dog_id);
  // Add more filters as needed
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getDaycareSession(id) {
  const { data, error } = await supabase
    .from('daycare_sessions')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

// UPGRADED CREATE FUNCTION:
export async function createDaycareSession(payload, serverOverride = null) {
  // If you call this from the controller, pass in the Fastify server as serverOverride!
  const server = serverOverride || { supabase };
  const { tenant_id, user_id, dog_ids, session_date, ...rest } = payload;

  // 1. Compute price using priceRules
  const pricingResult = await previewPrice(server, 'daycare', {
    tenant_id,
    session_date,
    dog_ids
  });
  if (pricingResult.error) throw new Error(pricingResult.error);
  const price = pricingResult.price;
  const breakdown = pricingResult.breakdown || [];

  // 2. Check for approval need (cohort overlap)
  const requiresApproval = await needsApproval(server, tenant_id, dog_ids, session_date);

  // 3. Insert daycare_session
  const { data: session, error } = await server.supabase
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
  if (error) throw error;

  // 4. Insert to pending_services if auto-approved
  let pending_service = null;
  if (!requiresApproval) {
    const { data: ps, error: psErr } = await server.supabase
      .from('pending_services')
      .insert({
        user_id,
        tenant_id,
        service_date: session_date,
        service_type: 'daycare',
        daycare_request_id: session.id,
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

  return { daycare_session: session, pending_service, breakdown, requiresApproval };
}

export async function updateDaycareSession(id, updates) {
  const { data, error } = await supabase
    .from('daycare_sessions')
    .update(updates)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function deleteDaycareSession(id) {
  const { error } = await supabase
    .from('daycare_sessions')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return { success: true };
}
