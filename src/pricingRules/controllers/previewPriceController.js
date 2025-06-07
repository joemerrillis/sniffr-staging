// src/pricingRules/controllers/previewPriceController.js

import { previewPrice } from '../services/pricingEngine.js';

export async function previewPriceHandler(request, reply) {
  try {
    const { service_type, ...context } = request.body;
    if (!service_type) {
      console.error('[PreviewPrice] Missing service_type:', request.body);
      return reply.code(400).send({ error: 'Missing service_type' });
    }

    const result = await previewPrice(request.server, service_type, context);

    if (result.error) {
      // Log result.error with extra context
      console.error('[PreviewPrice] Rule logic error:', result.error, 'Input:', request.body, 'Result:', result);
      return reply.code(400).send({
        error: result.error.message || result.error.toString() || JSON.stringify(result.error),
        missing_fields: result.missing_fields || undefined,
        debug: result // Optionally: include the whole result for debugging (remove in prod)
      });
    }
    reply.send({ suggested_price: result.price, breakdown: result.breakdown });
  } catch (err) {
    // Thorough server logging
    console.error('[PreviewPrice] Exception caught:', err, 'Request body:', request.body);

    // Always serialize as much as possible for the client
    reply.code(500).send({
      error: err.message || err.toString() || JSON.stringify(err),
      stack: err.stack,
      // Optionally: include err object (remove in prod if too verbose)
      err: typeof err === 'object' ? err : undefined
    });
  }
}
