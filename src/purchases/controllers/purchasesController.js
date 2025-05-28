// src/purchases/controllers/purchasesController.js

import {
  createPurchase,
  listPurchases,
  getPurchase,
  updatePurchaseStatus,
} from '../services/purchasesService.js';

import { promoteCart } from '../services/promoteCartService.js';

// For mock: You can hardcode or stub these (expand later as needed)
async function calculateTotal(server, cart) { return 100; }
async function inferTypeFromCart(server, cart) { return 'walk'; }

export async function checkout(request, reply) {
  const { cart, payment_method } = request.body;
  const user_id = request.user?.id || request.body.user_id;
  const tenant_id = request.user?.tenant_id || request.body.tenant_id;
  const server = request.server;

  const amount = await calculateTotal(server, cart);
  const type = await inferTypeFromCart(server, cart);

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
