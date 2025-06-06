// src/purchases/controllers/purchasesController.js

import {
  createPurchase,
  listPurchases,
  getPurchase,
  updatePurchaseStatus,
} from '../services/purchasesService.js';

import { promoteCart } from '../services/promoteCartService.js';

/**
 * Calculate total and canonical type for a cart.
 * - For boardings: uses canonical price from boardings table.
 * - For walks/daycare: you can expand as needed.
 * - Errors if mixed types (for now).
 */
async function canonicalCartInfo(server, cart) {
  // Fetch all pending_services in the cart
  const { data: services, error } = await server.supabase
    .from('pending_services')
    .select('id, tenant_id, service_type, boarding_request_id, price')
    .in('id', cart);

  if (error || !services || services.length === 0) {
    throw new Error('Could not find cart items in pending_services.');
  }

  // Ensure all cart items are the same tenant
  const uniqueTenantIds = [...new Set(services.map(s => s.tenant_id))];
  if (uniqueTenantIds.length > 1) {
    throw new Error('All cart items must belong to the same tenant.');
  }
  const tenant_id = uniqueTenantIds[0];

  // Determine service types in the cart
  const uniqueTypes = [...new Set(services.map(s => s.service_type))];
  if (uniqueTypes.length !== 1) {
    throw new Error('All cart items must be the same service type.');
  }
  const type = uniqueTypes[0];

  // Canonical total calculation
  let amount = 0;
  if (type === 'boarding') {
    // Use canonical price from boardings table
    for (const s of services) {
      if (!s.boarding_request_id) throw new Error('Boarding request missing ID');
      const { data: boardingRow, error: boardingErr } = await server.supabase
        .from('boardings')
        .select('price')
        .eq('id', s.boarding_request_id)
        .single();
      if (boardingErr || !boardingRow) throw new Error('Could not find boarding for price');
      amount += Number(boardingRow.price || 0);
    }
  } else if (type === 'walk') {
    // Use price from pending_services (expand as needed)
    amount = services.reduce((sum, s) => sum + Number(s.price || 0), 0);
  } else if (type === 'daycare') {
    // Add daycare logic here if needed
    amount = services.reduce((sum, s) => sum + Number(s.price || 0), 0);
  } else {
    throw new Error(`Unsupported service type: ${type}`);
  }

  return { tenant_id, type, amount, services };
}

export async function checkout(request, reply) {
  try {
    const { cart, payment_method } = request.body;
    const user_id = request.user?.id || request.body.user_id;
    const server = request.server;

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
