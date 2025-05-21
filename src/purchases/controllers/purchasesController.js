// src/purchases/controllers/purchasesController.js
import {
  createPurchase,
  listPurchases,
  getPurchase,
  updatePurchaseStatus,
} from '../services/purchasesService.js';

import { promoteCart } from '../services/promoteCartService.js'; // see note below

// Simulated provider registry (stripe, paypal, etc.)
import { getPaymentProviderHandler } from '../services/paymentProviders.js';

export async function checkout(req, reply) {
  const { cart, payment_method } = req.body;
  // TODO: Get user/tenant from session/auth (stubbed here)
  const user_id = req.user?.id || req.body.user_id; // fallback for local testing
  const tenant_id = req.user?.tenant_id || req.body.tenant_id;
  // TODO: Validate cart, calculate total, detect type if needed
  const amount = await calculateTotal(cart); // you’ll need to implement
  const type = await inferTypeFromCart(cart); // or pass in explicitly

  // Prepare payment provider logic (returns paymentUrl, reference_id)
  const provider = getPaymentProviderHandler(payment_method);
  const { paymentUrl, reference_id } = await provider.initiateCheckout({ amount, user_id, cart });

  // Create purchase row
  const purchase = await createPurchase({
    tenant_id,
    user_id,
    cart,
    payment_method,
    type,
    amount,
    reference_id
  });

  reply.code(201).send({ purchase, paymentUrl });
}

export async function list(req, reply) {
  // TODO: scope by auth role
  const user_id = req.user?.id;
  const tenant_id = req.user?.tenant_id;
  const isAdmin = req.user?.role === 'tenant_admin' || req.user?.role === 'platform_admin';
  const purchases = await listPurchases({ tenant_id, user_id, isAdmin });
  reply.send({ purchases });
}

export async function retrieve(req, reply) {
  const { id } = req.params;
  const purchase = await getPurchase(id);
  reply.send({ purchase });
}

export async function webhook(req, reply) {
  const { provider } = req.params;
  const handler = getPaymentProviderHandler(provider);
  // Verify signature/authenticity
  const verified = handler.verifyWebhook(req);
  if (!verified) return reply.code(401).send({ error: 'Invalid signature' });

  const event = req.body;
  const reference_id = handler.getReferenceId(event);
  const purchase = await findPurchaseByReference(reference_id); // add to services
  if (!purchase) return reply.code(404).send({ error: 'Purchase not found' });

  // Idempotency: skip if already paid
  if (purchase.status === 'paid') return reply.code(200).send({ ok: true });

  // Mark as paid, set paid_at
  const now = new Date().toISOString();
  await updatePurchaseStatus(purchase.id, 'paid', reference_id, now);

  // Promote cart (atomic)
  await promoteCart(purchase);

  reply.code(200).send({ ok: true });
}
