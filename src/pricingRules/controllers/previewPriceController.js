// /controllers/previewPriceController.js

import { previewServicePrice } from '../services/pricingRulesService.js';
import { logAndReplyError } from '../utils/logging.js';

/**
 * Handler for POST /pricing-rules/preview-price
 * - Calls pricingRulesService.previewServicePrice, which delegates to pricingEngine
 * - Returns { price, breakdown } or 400 with error
 */
export async function previewPriceHandler(request, reply) {
  try {
    const { tenant_id, service_type, ...serviceData } = request.body;
    if (!tenant_id || !service_type) {
      return logAndReplyError(reply, 400, 'Missing tenant_id or service_type', { input: request.body });
    }
    const result = await previewServicePrice(request.server, { tenant_id, service_type, ...serviceData });
    if (result.error) {
      return logAndReplyError(reply, 400, result.error, { input: request.body, result });
    }
    reply.send({ price: result.price, breakdown: result.breakdown });
  } catch (err) {
    logAndReplyError(reply, 500, err, { input: request.body });
  }
}
