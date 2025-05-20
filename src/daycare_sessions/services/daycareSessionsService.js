import supabase from '../core/supabaseClient.js';

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

export async function createDaycareSession(payload) {
  const { data, error } = await supabase
    .from('daycare_sessions')
    .insert([payload])
    .single();
  if (error) throw error;
  return data;
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
