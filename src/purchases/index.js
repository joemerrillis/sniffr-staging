// src/purchases/index.js

import fp from 'fastify-plugin';
import routes from './routes.js';
import { purchasesSchemas } from './schemas/purchasesSchemas.js';
// Import any additional schemas you plan to reference:
import { Delegation } from './schemas/delegationSchemas.js'; // <-- create this stub if not present
import { PricePreview } from '../pricingRules/schemas/pricePreviewSchemas.js'; // <-- create if needed

export default fp(async function purchasesPlugin(fastify, opts) {
  // Register all purchase-related schemas
  fastify.addSchema(purchasesSchemas.Purchase);
  fastify.addSchema(purchasesSchemas.CheckoutRequest);
  fastify.addSchema(purchasesSchemas.CheckoutResponse);

  // Optional: Add envelope schemas if you use them
  if (purchasesSchemas.PurchasesEnvelope) fastify.addSchema(purchasesSchemas.PurchasesEnvelope);
  if (purchasesSchemas.PurchaseEnvelope) fastify.addSchema(purchasesSchemas.PurchaseEnvelope);

  // Register Delegation schema if used anywhere (referenced by $ref)
  if (Delegation) fastify.addSchema(Delegation);

  // Register PricePreview schema if included in purchase/response
  if (PricePreview) fastify.addSchema(PricePreview);

  // Register more as needed for future extensibility

  // Register the plugin's routes with the /purchases prefix
  fastify.register(routes, { prefix: '/purchases' });
});
