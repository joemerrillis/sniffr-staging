// src/households/services/householdService.js

export async function createHousehold(supabase, payload) {
  const { data, error } = await supabase
    .from('households')
    .insert([payload])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getHouseholdById(supabase, id) {
  const { data, error } = await supabase
    .from('households')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function listHouseholdsForTenant(supabase, tenant_id) {
  const { data, error } = await supabase
    .from('households')
    .select('*')
    .eq('tenant_id', tenant_id);
  if (error) throw error;
  return data;
}

export async function listHouseholdsForUser(supabase, user_id) {
  const { data, error } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user_id);
  if (error) throw error;
  const ids = data.map(x => x.household_id);
  if (!ids.length) return [];
  const { data: households, error: err2 } = await supabase
    .from('households')
    .select('*')
    .in('id', ids);
  if (err2) throw err2;
  return households;
}

export async function updateHousehold(supabase, id, updates) {
  const { data, error } = await supabase
    .from('households')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
