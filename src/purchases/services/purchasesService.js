// src/purchases/services/purchasesService.js

/**
 * Log helper for clear module prefixing.
 */
function logPurchases(...args) {
  console.log('[PurchasesService]', ...args);
}

/**
 * Create a new purchase.
 */
export async function createPurchase(server, { tenant_id, user_id, cart, payment_method, type, amount, reference_id, status = 'pending', paid_at = null }) {
  logPurchases('createPurchase called with:', {
    tenant_id, user_id, cart, payment_method, type, amount, reference_id, status, paid_at
  });

  // Sanity-check cart type before insert
  logPurchases('typeof cart:', typeof cart, '| cart sample:', Array.isArray(cart) ? cart[0] : cart);

  try {
    const { data, error } = await server.supabase
      .from('purchases')
      .insert([{
        tenant_id,
        user_id,
        cart,
        payment_method,
        type,
        amount,
        reference_id,
        status,
        paid_at
      }])
      .select('*')
      .single();

    logPurchases('Supabase insert data:', data);
    logPurchases('Supabase insert error:', error);

    if (error) {
      logPurchases('[ERROR] Supabase insert failed:', error);
      throw error;
    }
    if (!data || !data.id) {
      logPurchases('[ERROR] Inserted row missing "id":', data);
      throw new Error('Purchase insert did not return an ID. Possible DB schema mismatch.');
    }
    logPurchases('Inserted purchase row:', data);
    return data;
  } catch (err) {
    logPurchases('[EXCEPTION] createPurchase failed:', err);
    throw err;
  }
}

/**
 * List all purchases for a tenant, user, or admin.
 */
export async function listPurchases(server, { tenant_id, user_id, isAdmin = false }) {
  logPurchases('listPurchases called with:', { tenant_id, user_id, isAdmin });
  let query = server.supabase.from('purchases').select('*');
  if (isAdmin && tenant_id) {
    query = query.eq('tenant_id', tenant_id);
    logPurchases('Filtering by tenant_id (admin):', tenant_id);
  } else if (user_id) {
    query = query.eq('user_id', user_id);
    logPurchases('Filtering by user_id:', user_id);
  }
  const { data, error } = await query.order('created_at', { ascending: false });
  logPurchases('Supabase list data:', data);
  logPurchases('Supabase list error:', error);
  if (error) throw error;
  return data;
}

/**
 * Get a single purchase by ID.
 */
export async function getPurchase(server, id) {
  logPurchases('getPurchase called with id:', id);
  const { data, error } = await server.supabase
    .from('purchases')
    .select('*')
    .eq('id', id)
    .single();
  logPurchases('Supabase get data:', data);
  logPurchases('Supabase get error:', error);
  if (error) throw error;
  return data;
}

/**
 * Update purchase status (optionally with reference ID or paid_at).
 */
export async function updatePurchaseStatus(server, id, status, reference_id = null, paid_at = null) {
  logPurchases('updatePurchaseStatus called with:', { id, status, reference_id, paid_at });
  const { data, error } = await server.supabase
    .from('purchases')
    .update({ status, reference_id, paid_at })
    .eq('id', id)
    .select('*')
    .single();
  logPurchases('Supabase update data:', data);
  logPurchases('Supabase update error:', error);
  if (error) throw error;
  return data;
}
