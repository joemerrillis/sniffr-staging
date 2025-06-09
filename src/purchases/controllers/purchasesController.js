import {
  createPurchase,
  listPurchases,
  getPurchase,
  updatePurchaseStatus,
} from '../services/purchasesService.js';

import { promoteCart } from '../services/promoteCartService.js';
import { previewPrice } from '../../pricingRules/services/pricingEngine.js';

// --- Logging helper for this controller
function logPurchasesCtrl(...args) {
  console.log('[PurchasesController]', ...args);
}

/**
 * Fetch all pending_services rows for a cart, and return as enriched array.
 */
async function fetchCartServices(server, cart) {
  logPurchasesCtrl('Fetching pending_services for cart:', cart);
  const { data, error } = await server.supabase
    .from('pending_services')
    .select('*')
    .in('id', cart);
  logPurchasesCtrl('Cart fetch result:', data, '| error:', error);
  if (error) throw new Error('DB error fetching cart items: ' + error.message);
  return data;
}

/**
 * Build the full context object for price preview (matches pendingServices logic).
 */
function buildPriceContext(serviceRow) {
  let day_of_week = serviceRow.day_of_week;
  if (!day_of_week && serviceRow.service_date) {
    day_of_week = new Date(serviceRow.service_date).getDay();
  }
  let window_start = serviceRow.window_start;
  if (!window_start && serviceRow.details?.start) window_start = serviceRow.details.start;
  const context = {
    tenant_id: serviceRow.tenant_id,
    user_id: serviceRow.user_id,
    dog_ids: serviceRow.dog_ids || [],
    walk_length_minutes: serviceRow.walk_length_minutes || serviceRow.details?.walk_length_minutes,
    day_of_week,
    window_start,
    service_date: serviceRow.service_date,
    ...serviceRow.details,
    __raw: serviceRow
  };
  logPurchasesCtrl('Price context for serviceRow', serviceRow.id, ':', context);
  return context;
}

/**
 * For a cart, enrich all services with live price preview & breakdown, sum total.
 * Returns: { enrichedCart, total, breakdown, tenant_ids, type }
 */
async function enrichCartAndCalculate(server, cart) {
  logPurchasesCtrl('enrichCartAndCalculate called for cart:', cart);
  const services = await fetchCartServices(server, cart);
  if (!services?.length) throw new Error('Cart is empty or invalid IDs');

  const tenantIds = [...new Set(services.map(s => s.tenant_id))];
  const uniqueTypes = [...new Set(services.map(s => s.service_type))];
  const type = uniqueTypes.length === 1 ? uniqueTypes[0] : 'mixed';

  logPurchasesCtrl('Unique tenantIds:', tenantIds, '| Unique types:', uniqueTypes);

  let total = 0;
  let allBreakdown = [];
  const enrichedCart = await Promise.all(
    services.map(async (row) => {
      logPurchasesCtrl('Processing cart item:', row.id, row);
      const context = buildPriceContext(row);
      let service_type = row.service_type || context.service_type || 'walk_window';
      logPurchasesCtrl('Previewing price for service_type:', service_type, '| context:', context);
      const pricePreview = await previewPrice(server, service_type, context);
      logPurchasesCtrl('Price preview result:', pricePreview);

      const price = pricePreview.price ?? 0;
      total += price;
      allBreakdown.push({
        pending_service_id: row.id,
        ...pricePreview
      });
      return {
        ...row,
        price_preview: pricePreview
      };
    })
  );
  logPurchasesCtrl('Total price:', total, '| Breakdown:', allBreakdown);

  return {
    enrichedCart,
    total,
    breakdown: allBreakdown,
    tenantIds,
    type,
  };
}

export async function checkout(request, reply) {
  logPurchasesCtrl('checkout() called');
  logPurchasesCtrl('Request body:', request.body);
  logPurchasesCtrl('Request user:', request.user);

  try {
    let { cart, payment_method } = request.body;
    const user_id = request.user?.id || request.body.user_id;
    const server = request.server;

    if (typeof cart === 'string') cart = [cart];
    if (!Array.isArray(cart) || cart.length === 0) {
      logPurchasesCtrl('[ERROR] Cart is empty or invalid:', cart);
      return reply.code(400).send({ error: "Cart must be a non-empty array of pending_service IDs" });
    }

    logPurchasesCtrl('Normalized cart:', cart, '| payment_method:', payment_method);

    // Price, breakdown, details
    const { enrichedCart, total, breakdown, tenantIds, type } =
      await enrichCartAndCalculate(server, cart);

    logPurchasesCtrl('Cart enrichment result:', {
      enrichedCart, total, breakdown, tenantIds, type
    });

    if (tenantIds.length > 1) {
      logPurchasesCtrl('[ERROR] Multi-tenant purchase attempt:', tenantIds);
      return reply.code(400).send({ error: 'Multi-tenant cart purchases are not yet supported.' });
    }
    const tenant_id = tenantIds[0];

    // Compose and create purchase row (store only IDs for cart as before)
    const now = new Date().toISOString();
    logPurchasesCtrl('Creating purchase row...');
    // Only store array of IDs in the DB
    const purchase = await createPurchase(server, {
      tenant_id,
      user_id,
      cart: enrichedCart.map(item => item.id), // <-- Ensure array of IDs
      payment_method,
      type,
      amount: total,
      reference_id: `mock-${Date.now()}`,
      status: 'paid',
      paid_at: now,
      price_breakdown: breakdown,
    });
    logPurchasesCtrl('Purchase created:', purchase);

    // Hydrate the purchase.cart for API response (patch step)
    purchase.cart = enrichedCart;

    // Promote cart services (fulfill, delete, etc)
    logPurchasesCtrl('Promoting cart services...');
    // Pass only the array of IDs to promoteCart!
    await promoteCart(server, { ...purchase, cart: enrichedCart.map(item => item.id) });

    // Final API response (with logs)
    const response = {
      purchase,
      cart: enrichedCart,
      price_breakdown: breakdown,
      paymentUrl: null
    };
    logPurchasesCtrl('checkout() response:', response);

    reply.code(201).send(response);
  } catch (err) {
    logPurchasesCtrl('[ERROR] checkout() failed:', err);
    reply.code(400).send({ error: err.message || err });
  }
}

export async function list(request, reply) {
  logPurchasesCtrl('list() called. Request user:', request.user);
  const user_id = request.user?.id;
  const tenant_id = request.user?.tenant_id;
  const isAdmin = request.user?.role === 'tenant_admin' || request.user?.role === 'platform_admin';
  const server = request.server;
  const purchases = await listPurchases(server, { tenant_id, user_id, isAdmin });
  logPurchasesCtrl('Purchases found:', purchases);
  reply.send({ purchases });
}

export async function retrieve(request, reply) {
  logPurchasesCtrl('retrieve() called. Params:', request.params);
  const { id } = request.params;
  const server = request.server;
  const purchase = await getPurchase(server, id);
  logPurchasesCtrl('Purchase retrieved:', purchase);
  reply.send({ purchase });
}

export async function webhook(request, reply) {
  logPurchasesCtrl('webhook() called. Params:', request.params, '| Body:', request.body);
  reply.code(200).send({ ok: true });
}
