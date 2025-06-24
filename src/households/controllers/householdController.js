import {
  createHousehold,
  getHouseholdById,
  listHouseholdsForTenant,
  listHouseholdsForUser,
  updateHousehold
} from '../services/householdService.js';

import { getSupabase, getUserId, getTenantId } from '../../chat/utils/chatUtils.js';

export async function createHouseholdHandler(request, reply) {
  try {
    const supabase = getSupabase(request);
    const payload = request.body;
    const household = await createHousehold(supabase, payload);
    return reply.code(201).send({ data: household });
  } catch (err) {
    return reply.code(400).send({ error: err.message });
  }
}

export async function getHouseholdHandler(request, reply) {
  try {
    const supabase = getSupabase(request);
    const { id } = request.params;
    const household = await getHouseholdById(supabase, id);
    return reply.send({ data: household });
  } catch (err) {
    return reply.code(404).send({ error: 'Household not found' });
  }
}

export async function listHouseholdsForTenantHandler(request, reply) {
  try {
    const supabase = getSupabase(request);
    const tenant_id = getTenantId(request);
    const households = await listHouseholdsForTenant(supabase, tenant_id);
    return reply.send({ data: households });
  } catch (err) {
    return reply.code(400).send({ error: err.message });
  }
}

export async function listHouseholdsForUserHandler(request, reply) {
  try {
    const supabase = getSupabase(request);
    const user_id = getUserId(request);
    const households = await listHouseholdsForUser(supabase, user_id);
    return reply.send({ data: households });
  } catch (err) {
    return reply.code(400).send({ error: err.message });
  }
}

export async function updateHouseholdHandler(request, reply) {
  try {
    const supabase = getSupabase(request);
    const { id } = request.params;
    const updates = request.body;
    const household = await updateHousehold(supabase, id, updates);
    return reply.send({ data: household });
  } catch (err) {
    return reply.code(400).send({ error: err.message });
  }
}
