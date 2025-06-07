// src/pricingRules/controllers/previewPriceController.js

import { previewPrice } from '../services/pricingEngine.js';

export async function previewPriceHandler(request, reply) {
  try {
    const { service_type, ...context } = request.body;
    if (!service_type) {
      return reply.code(400).send({ error: 'Missing service_type' });
    }

    const result = await previewPrice(request.server, service_type, context);

    if (result.error) {
      // If missing_fields is present, include for UI
      return reply.code(400).send(result);
    }
    reply.send({ suggested_price: result.price, breakdown: result.breakdown });
  } catch (err) {
    reply.code(500).send({ error: err.message || err });
  }
}
