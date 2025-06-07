// -- Core CRUD --
export async function listPricingRules(server, tenant_id) {
  const { data, error } = await server.supabase
    .from('pricing_rules') // Use generic rules table for all services
    .select('*')
    .eq('tenant_id', tenant_id)
    .order('priority', { ascending: true });
  if (error) throw error;
  return data;
}

export async function createPricingRule(server, rule) {
  const { data, error } = await server.supabase
    .from('pricing_rules')
    .insert([rule])
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updatePricingRule(server, id, updates) {
  updates.updated_at = new Date().toISOString();
  const { data, error } = await server.supabase
    .from('pricing_rules')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function deletePricingRule(server, id) {
  const { error } = await server.supabase
    .from('pricing_rules')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// -- Pricing Application Logic --
async function fetchServiceData(server, { service_type, service_id }) {
  // Dynamic table lookup (add more cases as needed)
  if (service_type === 'boarding') {
    const { data, error } = await server.supabase.from('boardings').select('*').eq('id', service_id).single();
    if (error) throw error;
    return data;
  }
  if (service_type === 'daycare') {
    const { data, error } = await server.supabase.from('daycare_sessions').select('*').eq('id', service_id).single();
    if (error) throw error;
    return data;
  }
  if (service_type === 'walk_window') {
    const { data, error } = await server.supabase.from('client_walk_windows').select('*').eq('id', service_id).single();
    if (error) throw error;
    return data;
  }
  if (service_type === 'walk_request') {
    const { data, error } = await server.supabase.from('client_walk_requests').select('*').eq('id', service_id).single();
    if (error) throw error;
    return data;
  }
  throw new Error(`Unsupported service_type: ${service_type}`);
}

export async function previewServicePrice(server, { tenant_id, service_type, service_id, ...context }) {
  // Get the service instance (boarding, daycare, etc)
  const serviceData = await fetchServiceData(server, { service_type, service_id });
  // Fetch rules for tenant
  const rules = await listPricingRules(server, tenant_id);

  let priceSoFar = 0;
  let breakdown = [];
  let matched = false;

  for (const rule of rules.filter(r => r.enabled)) {
    // -- NEW: Only apply the rule if all rule_data keys match context (with normalization) --
    let matches = true;
    if (rule.rule_data && typeof rule.rule_data === 'object') {
      for (const [k, v] of Object.entries(rule.rule_data)) {
        // Log both values and their types for easy debugging
        console.log(`[DEBUG:rule-match] key: ${k} | rule:`, v, typeof v, '| context:', context[k], typeof context[k]);
        if (
          context[k] == null ||
          String(context[k]) !== String(v)
        ) {
          matches = false;
          break;
        }
      }
    }
    if (!matches) continue;
    matched = true;

    // Now apply price logic
    let adjustment = 0;
    if (rule.price_adjustment_type === 'set') {
      adjustment = rule.price_adjustment_value;
      priceSoFar = adjustment;
    } else if (rule.price_adjustment_type === 'fixed') {
      adjustment = rule.price_adjustment_value;
      priceSoFar += adjustment;
    } else if (rule.price_adjustment_type === 'percent') {
      adjustment = priceSoFar * (rule.price_adjustment_value / 100);
      priceSoFar += adjustment;
    } else if (rule.price_adjustment_type === 'override') {
      priceSoFar = rule.price_adjustment_value;
      adjustment = 0;
    }
    breakdown.push({
      id: rule.id,
      name: rule.name,
      rule_type: rule.rule_type,
      description: rule.description,
      adjustment,
      price_so_far: priceSoFar
    });
  }

  // If nothing matched, return a clear error in the breakdown.
  if (!matched) {
    return {
      price: 0,
      breakdown: [],
      serviceData,
      error: 'No pricing rule matched.'
    };
  }

  return { price: priceSoFar, breakdown, serviceData };
}
