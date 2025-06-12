// /controllers/previewPriceController.js

import { previewPrice } from '../services/pricingEngine.js';
import { logAndReplyError } from '../utils/logging.js';

export async function previewPrice(request, reply) {
  try {
    const { service_type, ...context } = request.body;
    if (!service_type) {
      return logAndReplyError(reply, 400, 'Missing service_type', { input: request.body });
    }

    const result = await previewPrice(request.server, service_type, context);
    if (result.error) {
      return logAndReplyError(reply, 400, result.error, { input: request.body, result });
    }
    reply.send({ price: result.price, breakdown: result.breakdown });
  } catch (err) {
    logAndReplyError(reply, 500, err, { input: request.body });
  }
}
