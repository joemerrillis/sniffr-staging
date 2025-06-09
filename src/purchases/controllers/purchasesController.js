// src/purchases/controllers/purchasesController.js

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

// Fetch all pending_services rows for a cart
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

// Build the full context object for price preview
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

// Group services by both tenant_id and service_type
function groupCartServices(services) {
  const grouped = {};
  for (const s of services) {
    const key = `${s.tenant_id}::${s.service_type}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(s);
  }
  return grouped;
}

// Enrich a group of cart services with price previews, breakdown, etc.
async function enrichCartGroup(server, group) {
  let total = 0;
  let allBreakdown = [];
  const enrichedCart = await Promise.all(
    group.map(async (row) => {
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
  // Assumes all in group have same type/tenant
  const tenant_id = group[0].tenant_id;
  const type = group[0].service_type;
  return {
    enrichedCart,
    total,
    breakdown: allBreakdown,
    tenant_id,
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

    // Fetch all cart services
    const services = await fetchCartServices(server, cart);
    if (!services?.length) {
      logPurchasesCtrl('[ERROR] No valid pending_service IDs found in cart');
      return reply.code(400).send({ error: "Cart items not found" });
    }

    // Group by both tenant_id and service_type
    const grouped = groupCartServices(services);
    logPurchasesCtrl('Grouped cart:', grouped);

    const purchaseResults = [];
    for (const [groupKey, group] of Object.entries(grouped)) {
      // Enrich, price, etc. for each group
      const { enrichedCart, total, breakdown, tenant_id, type } = await enrichCartGroup(server, group);

      const now = new Date().toISOString();
      logPurchasesCtrl(`[${groupKey}] Creating purchase row...`);

      // Only store array of IDs in the DB
      const purchase = await createPurchase(server, {
        tenant_id,
        user_id,
        cart: enrichedCart.map(item => item.id), // array of IDs only in DB
        payment_method,
        type,
        amount: total,
        reference_id: `mock-${Date.now()}-${type}`,
        status: 'paid',
        paid_at: now,
        price_breakdown: breakdown,
      });

      logPurchasesCtrl(`[${groupKey}] Purchase created:`, purchase);

      // Hydrate the purchase.cart for API response (patch step)
      purchase.cart = enrichedCart;

      // --- FIX: Never let price_breakdown be null (schema requires array/object)
      if (purchase.price_breakdown == null) {
        purchase.price_breakdown = [];
      }

      // Promote cart services
      logPurchasesCtrl(`[${groupKey}] Promoting cart services...`);
      await promoteCart(server, { ...purchase, cart: enrichedCart.map(item => item.id) });

      // Add result for this purchase
      purchaseResults.push({
        purchase,
        cart: enrichedCart,
        price_breakdown: breakdown,
        paymentUrl: null // Stripe placeholder
      });
      logPurchasesCtrl(`[${groupKey}] checkout() response chunk:`, purchaseResults[purchaseResults.length-1]);
    }

    // Response: array if more than one purchase, object if just one
    const response =
      purchaseResults.length === 1
        ? purchaseResults[0]
        : { purchases: purchaseResults };

    // === Key debug: log what we're about to send (fully expanded) ===
    console.log('=== ACTUAL FINAL RESPONSE ===');
    console.dir(response, { depth: null });

    // Try JSON.stringify just to check for serializability before sending
    try {
      JSON.stringify(response);
    } catch (err) {
      logPurchasesCtrl('[ERROR] Response is not serializable:', err);
      return reply.code(500).send({ error: "Response not serializable" });
    }

    logPurchasesCtrl('Final checkout() response (ready to send)');
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
