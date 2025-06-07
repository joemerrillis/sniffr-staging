import {
  listPricingRules,
  createPricingRule,
  updatePricingRule,
  deletePricingRule,
  previewServicePrice,
} from '../services/pricingRulesService.js';

// List rules for a tenant
export async function getRules(request, reply) {
  try {
    const { tenant_id } = request.query;
    const rules = await listPricingRules(request.server, tenant_id);
    reply.send({ rules });
  } catch (err) {
    reply.code(500).send({ error: err.message || err });
  }
}

// Create rule
export async function postRule(request, reply) {
  try {
    const rule = request.body;
    const created = await createPricingRule(request.server, rule);
    reply.code(201).send({ rule: created });
  } catch (err) {
    reply.code(400).send({ error: err.message || err });
  }
}

// Update rule
export async function patchRule(request, reply) {
  try {
    const { id } = request.params;
    const updated = await updatePricingRule(request.server, id, request.body);
    reply.send({ rule: updated });
  } catch (err) {
    reply.code(400).send({ error: err.message || err });
  }
}

// Delete rule
export async function deleteRule(request, reply) {
  try {
    const { id } = request.params;
    await deletePricingRule(request.server, id);
    reply.code(204).send();
  } catch (err) {
    reply.code(400).send({ error: err.message || err });
  }
}

// Preview price
export async function previewPrice(request, reply) {
  try {
    const { tenant_id, service_type, service_id } = request.body;
    if (!tenant_id || !service_type || !service_id) {
      return reply.code(400).send({ error: "Missing required fields" });
    }
    const { price, breakdown } = await previewServicePrice(request.server, request.body);
    reply.send({ price, breakdown });
  } catch (err) {
    reply.code(400).send({ error: err.message || err });
  }
}
