// src/purchases/controllers/purchasesController.js

import {
  createPurchase,
  listPurchases,
  getPurchase,
  updatePurchaseStatus,
} from '../services/purchasesService.js';

import { promoteCart } from '../services/promoteCartService.js';
import { previewPrice } from '../../pricingRules/services/pricingEngine.js';

/**
 * Fetch all pending_services rows for a cart, and return as enriched array.
 */
async function fetchCartServices(server, cart) {
  const { data, error } = await server.supabase
    .from('pending_services')
    .select('*')
    .in('id', cart);
  if (error) throw new Error('DB error fetching cart items: ' + error.message);
  return data;
}

/**
 * Build the full context object for price preview (matches pendingServices logic).
 */
function buildPriceContext(serviceRow) {
  // Derive context as in pendingServices controller
  let day_of_week = serviceRow.day_of_week;
  if (!day_of_week && serviceRow.service_date) {
    day_of_week = new Date(serviceRow.service_date).getDay();
  }
  let window_start = serviceRow.window_start;
  if (!window_start && serviceRow.details?.start) window_start = serviceRow.details.start;
  // Compose context
  return {
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
}

/**
 * For a cart, enrich all services with live price preview & breakdown, sum total.
 * Returns: { enrichedCart, total, breakdown, tenant_ids, type }
 */
async function enrichCartAndCalculate(server, cart) {
  const services = await fetchCartServices(server, cart);
  if (!services?.length) throw new Error('Cart is empty or invalid IDs');

  // Multi-tenant: group by tenant_id if needed in future
  const tenantIds = [...new Set(services.map(s => s.tenant_id))];
  // Group by type
  const uniqueTypes = [...new Set(services.map(s => s.service_type))];
  const type = uniqueTypes.length === 1 ? uniqueTypes[0] : 'mixed';

  // Price everything using pricingEngine
  let total = 0;
  let allBreakdown = [];
  const enrichedCart = await Promise.all(
    services.map(async (row) => {
      const context = buildPriceContext(row);
      let service_type = row.service_type || context.service_type || 'walk_window';
      const pricePreview = await previewPrice(server, service_type, context);
      // Use preview price, fallback to 0
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

  return {
    enrichedCart,
    total,
    breakdown: allBreakdown,
    tenantIds,
    type,
  };
}

export async function checkout(request, reply) {
  try {
    let { cart, payment_method } = request.body;
    const user_id = request.user?.id || request.body.user_id;
    const server = request.server;

    // Normalize cart input
    if (typeof cart === 'string') cart = [cart];
    if (!Array.isArray(cart) || cart.length === 0) {
      return reply.code(400).send({ error: "Cart must be a non-empty array of pending_service IDs" });
    }

    // Get full pricing breakdown & details
    const { enrichedCart, total, breakdown, tenantIds, type } =
      await enrichCartAndCalculate(server, cart);

    // For now: only allow one tenant per purchase (multi-tenant expansion later)
    if (tenantIds.length > 1) {
      return reply.code(400).send({ error: 'Multi-tenant cart purchases are not yet supported.' });
    }
    const tenant_id = tenantIds[0];

    // Compose purchase row
    const now = new Date().toISOString();
    const purchase = await createPurchase(server, {
      tenant_id,
      user_id,
      cart,
      payment_method,
      type,
      amount: total,
      reference_id: `mock-${Date.now()}`,
      status: 'paid',
      paid_at: now,
      price_breakdown: breakdown,
    });

    // Promote all services in the cart (fulfill, delete, etc)
    await promoteCart(server, purchase);

    // Respond with enriched purchase, breakdown, and full cart for transparency
    reply.code(201).send({
      purchase,
      cart: enrichedCart,
      price_breakdown: breakdown,
      paymentUrl: null // Placeholder for Stripe, etc.
    });
  } catch (err) {
    reply.code(400).send({ error: err.message || err });
  }
}

export async function list(request, reply) {
  const user_id = request.user?.id;
  const tenant_id = request.user?.tenant_id;
  const isAdmin = request.user?.role === 'tenant_admin' || request.user?.role === 'platform_admin';
  const server = request.server;
  const purchases = await listPurchases(server, { tenant_id, user_id, isAdmin });
  reply.send({ purchases });
}

export async function retrieve(request, reply) {
  const { id } = request.params;
  const server = request.server;
  const purchase = await getPurchase(server, id);
  reply.send({ purchase });
}

export async function webhook(request, reply) {
  // For now: stub
  reply.code(200).send({ ok: true });
}
