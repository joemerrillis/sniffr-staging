// src/boardings/controllers/pricingRulesController.js

export async function listPricingRules(request, reply) {
  const { tenant_id } = request.query;
  if (!tenant_id) return reply.code(400).send({ error: "Missing tenant_id" });

  const { data, error } = await request.server.supabase
    .from('boarding_pricing_rules')
    .select('*')
    .eq('tenant_id', tenant_id)
    .order('priority', { ascending: true });
  if (error) return reply.code(500).send({ error: error.message });

  reply.send({ rules: data });
}

export async function createPricingRule(request, reply) {
  const { tenant_id, name, priority, rule_type, rule_data, price_adjustment_type, price_adjustment_value, enabled, description } = request.body;
  if (!tenant_id || !name || !rule_type || !price_adjustment_type || price_adjustment_value === undefined) {
    return reply.code(400).send({ error: "Missing required fields" });
  }
  const { data, error } = await request.server.supabase
    .from('boarding_pricing_rules')
    .insert([{
      tenant_id,
      name,
      priority: priority || 100,
      rule_type,
      rule_data: rule_data || {},
      price_adjustment_type,
      price_adjustment_value,
      enabled: enabled !== undefined ? enabled : true,
      description,
    }])
    .select('*')
    .single();
  if (error) return reply.code(500).send({ error: error.message });
  reply.code(201).send({ rule: data });
}

export async function updatePricingRule(request, reply) {
  const { id } = request.params;
  const updates = request.body;
  if (!id) return reply.code(400).send({ error: "Missing rule id" });

  updates.updated_at = new Date().toISOString();

  const { data, error } = await request.server.supabase
    .from('boarding_pricing_rules')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();
  if (error) return reply.code(500).send({ error: error.message });
  reply.send({ rule: data });
}

export async function deletePricingRule(request, reply) {
  const { id } = request.params;
  if (!id) return reply.code(400).send({ error: "Missing rule id" });

  const { error } = await request.server.supabase
    .from('boarding_pricing_rules')
    .delete()
    .eq('id', id);
  if (error) return reply.code(500).send({ error: error.message });
  reply.code(204).send();
}
