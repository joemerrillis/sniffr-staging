// src/pricingRules/controllers/pricingRulesController.js

import {
  listPricingRules,
  createPricingRule,
  updatePricingRule,
  deletePricingRule
} from '../services/pricingRulesService.js';

export async function getRules(request, reply) {
  try {
    const { tenant_id } = request.query;
    const rules = await listPricingRules(request.server, tenant_id);
    reply.send({ rules });
  } catch (err) {
    console.error('[PricingRules] Failed to list rules', err, 'Query:', request.query);
    reply.code(500).send({ error: err.message || err });
  }
}

export async function postRule(request, reply) {
  try {
    const rule = request.body;
    const created = await createPricingRule(request.server, rule);
    reply.code(201).send({ rule: created });
  } catch (err) {
    console.error('[PricingRules] Failed to create rule', err, 'Body:', request.body);
    reply.code(400).send({ error: err.message || err });
  }
}

export async function patchRule(request, reply) {
  try {
    const { id } = request.params;
    const updated = await updatePricingRule(request.server, id, request.body);
    reply.send({ rule: updated });
  } catch (err) {
    console.error('[PricingRules] Failed to update rule', err, 'Params:', request.params, 'Body:', request.body);
    reply.code(400).send({ error: err.message || err });
  }
}

export async function deleteRule(request, reply) {
  try {
    const { id } = request.params;
    await deletePricingRule(request.server, id);
    reply.code(204).send();
  } catch (err) {
    console.error('[PricingRules] Failed to delete rule', err, 'Params:', request.params);
    reply.code(400).send({ error: err.message || err });
  }
}
