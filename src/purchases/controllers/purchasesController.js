// src/purchases/controllers/purchasesController.js

import {
  createPurchase,
  listPurchases,
  getPurchase,
  updatePurchaseStatus,
} from '../services/purchasesService.js';
import { promoteCart } from '../services/promoteCartService.js';
import { previewPrice } from '../../pricingRules/services/pricingEngine.js';

import {
  fetchCartServices,
  buildPriceContext,
  groupCartServices,
  enrichCartGroup,
} from '../utils/cartUtils.js';

function logPurchasesCtrl(...args) {
  console.log('[PurchasesController]', ...args);
}

export async function checkout(request, reply) {
  logPurchasesCtrl('checkout() called');
  try {
    let { cart, payment_method } = request.body;
    const user_id = request.user?.id || request.body.user_id;
    const server = request.server;

    if (typeof cart === 'string') cart = [cart];
    if (!Array.isArray(cart) || cart.length === 0) {
      return reply.code(400).send({ error: "Cart must be a non-empty array of pending_service IDs" });
    }

    const services = await fetchCartServices(server, cart, logPurchasesCtrl);
    if (!services?.length) {
      return reply.code(400).send({ error: "Cart items not found" });
    }

    const grouped = groupCartServices(services);
    const purchaseResults = [];

    for (const [groupKey, group] of Object.entries(grouped)) {
      const { enrichedCart, total, breakdown, tenant_id, type } =
        await enrichCartGroup(server, group, previewPrice, logPurchasesCtrl);

      const now = new Date().toISOString();
      const purchase = await createPurchase(server, {
        tenant_id,
        user_id,
        cart: enrichedCart.map(item => item.id),
        payment_method,
        type,
        amount: total,
        reference_id: `mock-${Date.now()}-${type}`,
        status: 'paid',
        paid_at: now,
        price_breakdown: { price: total, breakdown },
      });
      purchase.cart = enrichedCart;
      purchase.price_breakdown = { price: total, breakdown };
      await promoteCart(server, { ...purchase, cart: enrichedCart.map(item => item.id) });

      purchaseResults.push({
        purchase,
        cart: enrichedCart,
        price_breakdown: { price: total, breakdown },
        paymentUrl: null
      });
    }

    const response =
      purchaseResults.length === 1
        ? purchaseResults[0]
        : { purchases: purchaseResults };

    reply.code(201).send(response);
  } catch (err) {
    logPurchasesCtrl('[ERROR] checkout() failed:', err);
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
  reply.code(200).send({ ok: true });
}
