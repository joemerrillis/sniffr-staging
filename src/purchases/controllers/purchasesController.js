import {
  createPurchase,
  listPurchases,
  getPurchase
} from '../services/purchasesService.js';
import { promoteCart } from '../services/promoteCartService.js';

// For mock: You can hardcode or stub these (expand later as needed)
async function calculateTotal(cart) { return 100; }
async function inferTypeFromCart(cart) { return 'walk'; }

export async function checkout(req, reply) {
  const { cart, payment_method } = req.body;
  const user_id = req.user?.id || req.body.user_id;
  const tenant_id = req.user?.tenant_id || req.body.tenant_id;
  const amount = await calculateTotal(cart);
  const type = await inferTypeFromCart(cart);

  // Immediately create purchase as 'paid'
  const now = new Date().toISOString();
  const purchase = await createPurchase({
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
  await promoteCart(purchase);

  reply.code(201).send({ purchase, paymentUrl: null });
}

export async function list(req, reply) {
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

// The webhook is still here for future use, but is a stub for now
export async function webhook(req, reply) {
  reply.code(200).send({ ok: true });
}
