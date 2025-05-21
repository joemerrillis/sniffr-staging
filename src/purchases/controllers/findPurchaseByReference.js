// src/purchases/controllers/findPurchaseByReference.js
import supabase from '../../core/supabase.js';

export async function findPurchaseByReference(reference_id) {
  const { data, error } = await supabase
    .from('purchases')
    .select('*')
    .eq('reference_id', reference_id)
    .single();
  if (error) throw error;
  return data;
}
