// controllers/stripeConnectController.js

import {
  getStripeConnectOAuthUrl,
  handleStripeConnectCallback
} from '../services/stripeConnectService.js';

export async function startStripeConnect(req, reply) {
  try {
    // Get tenantId from user session or request context
    const tenantId = req.user?.tenant_id || req.query.tenant_id;
    if (!tenantId) {
      return reply.code(400).send({ error: 'Missing tenant_id' });
    }

    const { url } = await getStripeConnectOAuthUrl(tenantId);
    reply.send({ url });
  } catch (err) {
    req.log.error(err, 'Failed to start Stripe Connect');
    reply.code(500).send({ error: err.message });
  }
}

export async function stripeConnectCallback(req, reply) {
  try {
    const { code, state } = req.query;

    // You should also validate CSRF token if present
    const result = await handleStripeConnectCallback({ code, state }, req.server.supabase);
    // Optionally, redirect to a UI confirmation page
    // reply.redirect('https://app.sniffr.com/stripe/success');
    reply.send(result); // Envelope: { success: true }
  } catch (err) {
    req.log.error(err, 'Stripe Connect callback failed');
    reply.code(500).send({ error: err.message });
  }
}
