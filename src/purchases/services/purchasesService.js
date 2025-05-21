// src/purchases/services/purchasesService.js
import supabase from '../../core/supabase.js';

export async function createPurchase({ tenant_id, user_id, cart, payment_method, type, amount, reference_id }) {
  const { data, error } = await supabase
    .from('purchases')
    .insert([{
      tenant_id,
      user_id,
      cart,
      payment_method,
      type,
      amount,
      reference_id,
      status: 'pending'
    }])
    .single();
  if (error) throw error;
  return data;
}

export async function listPurchases({ tenant_id, user_id, isAdmin = false }) {
  let query = supabase.from('purchases').select('*');
  if (isAdmin && tenant_id) query = query.eq('tenant_id', tenant_id);
  else if (user_id) query = query.eq('user_id', user_id);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getPurchase(id) {
  const { data, error } = await supabase
    .from('purchases')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function updatePurchaseStatus(id, status, reference_id = null, paid_at = null) {
  const { data, error } = await supabase
    .from('purchases')
    .update({ status, reference_id, paid_at })
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}
