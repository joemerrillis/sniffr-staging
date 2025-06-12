export function logAndReplyError(reply, status, error, context = {}) {
  const msg = error?.message || error?.toString?.() || error;
  if (context) console.error('[PricingRules]', msg, context);
  reply.code(status).send({
    error: msg,
    ...(process.env.NODE_ENV !== 'production' && context ? { context } : {})
  });
}
