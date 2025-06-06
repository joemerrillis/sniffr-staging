// src/purchases/controllers/purchasesController.js

import {
  createPurchase,
  listPurchases,
  getPurchase,
  updatePurchaseStatus,
} from '../services/purchasesService.js';

import { promoteCart } from '../services/promoteCartService.js';

/**
 * For a walk pending_service, get price from client_walk_windows or client_walk_requests.
 * (You can expand this logic for other types if you have custom pricing rules.)
 */
async function getWalkPrice(server, pending) {
  // Try walk window first
  if (pending.walk_window_id) {
    const { data, error } = await server.supabase
      .from('client_walk_windows')
      .select('price')
      .eq('id', pending.walk_window_id)
      .single();
    if (data && typeof data.price === 'number') return data.price;
  }
  // Otherwise try walk request
  if (pending.request_id) {
    const { data, error } = await server.supabase
      .from('client_walk_requests')
      .select('price')
      .eq('id', pending.request_id)
      .single();
    if (data && typeof data.price === 'number') return data.price;
  }
  // Fallback
  return 0;
}

/**
 * For daycare, get price from daycare_sessions.
 */
async function getDaycarePrice(server, pending) {
  if (pending.daycare_request_id) {
    const { data, error } = await server.supabase
      .from('daycare_sessions')
      .select('price')
      .eq('id', pending.daycare_request_id)
      .single();
    if (data && typeof data.price === 'number') return data.price;
  }
  // Fallback
  return 0;
}

/**
 * For boardings, get price from boardings.
 */
async function getBoardingPrice(server, pending) {
  if (pending.boarding_request_id) {
    const { data, error } = await server.supabase
      .from('boardings')
      .select('price')
      .eq('id', pending.boarding_request_id)
      .single();
    if (data && typeof data.price === 'number') return data.price;
  }
  // Fallback
  return 0;
}

/**
 * Calculate total and canonical type for a cart.
 * All pricing is fetched from source-of-truth tables.
 * Errors if mixed types (for now).
 */
async function canonicalCartInfo(server, cart) {
  // Fetch all pending_services in the cart
  const { data: services, error } = await server.supabase
    .from('pending_services')
    .select('id, tenant_id, service_type, walk_window_id, request_id, daycare_request_id, boarding_request_id')
    .in('id', cart);

  if (error) {
    throw new Error('Database error fetching cart items: ' + error.message);
  }
  if (!services || services.length === 0) {
    throw new Error('Could not find cart items in pending_services.');
  }

  // Ensure all cart items are the same tenant
  const uniqueTenantIds = [...new Set(services.map(s => s.tenant_id))];
  if (uniqueTenantIds.length > 1) {
    throw new Error('All cart items must belong to the same tenant.');
  }
  const tenant_id = uniqueTenantIds[0];

  // Ensure all items are the same service type
  const uniqueTypes = [...new Set(services.map(s => s.service_type))];
  if (uniqueTypes.length !== 1) {
    throw new Error('All cart items must be the same service type.');
  }
  const type = uniqueTypes[0];

  // Canonical total calculation
  let amount = 0;
  if (type === 'boarding') {
    for (const s of services) {
      amount += await getBoardingPrice(server, s);
    }
  } else if (type === 'walk') {
    for (const s of services) {
      amount += await getWalkPrice(server, s);
    }
  } else if (type === 'daycare') {
    for (const s of services) {
      amount += await getDaycarePrice(server, s);
    }
  } else {
    throw new Error(`Unsupported service type: ${type}`);
  }

  return { tenant_id, type, amount, services };
}

export async function checkout(request, reply) {
  try {
    let { cart, payment_method } = request.body;
    const user_id = request.user?.id || request.body.user_id;
    const server = request.server;

    // Make sure cart is always an array
    if (typeof cart === 'string') cart = [cart];
    if (!Array.isArray(cart) || cart.length === 0) {
      return reply.code(400).send({ error: "Cart must be a non-empty array of pending_service IDs" });
    }

    // Canonical info: always correct type and amount
    const { tenant_id, type, amount } = await canonicalCartInfo(server, cart);

    // Immediately create purchase as 'paid'
    const now = new Date().toISOString();
    const purchase = await createPurchase(server, {
      tenant_id,
      user_id,
      cart,
      payment_method,
      type,
      amount,
      reference_id: `mock-${Date.now()}`,
      status: 'paid',
      paid_at: now
    });

    // Instantly promote all services
    await promoteCart(server, purchase);

    reply.code(201).send({ purchase, paymentUrl: null });
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
