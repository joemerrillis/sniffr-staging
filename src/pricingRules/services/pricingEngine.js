// src/pricingRules/services/pricingEngine.js

import { serviceTypeRequiredFields } from './requiredFields.js';

// Given context, apply pricing rules for a service_type
export async function previewPrice(server, service_type, context) {
  // Validate fields
  const missing = [];
  const required = serviceTypeRequiredFields[service_type] || [];
  for (const f of required) {
    if (!(f in context) || context[f] === undefined || context[f] === null) {
      missing.push(f);
    }
  }
  if (missing.length > 0) {
    return { error: `Missing required fields: ${missing.join(', ')}`, missing_fields: missing };
  }

  // Fetch rules for this tenant & service_type
  const { data: rules, error } = await server.supabase
    .from('pricing_rules')
    .select('*')
    .eq('tenant_id', context.tenant_id)
    .eq('rule_type', service_type)
    .eq('enabled', true)
    .order('priority', { ascending: true });

  if (error) return { error: error.message };

  // Run rule engine (simple demo logic)
  let price = 0;
  const breakdown = [];
  for (const rule of rules) {
    // Example logic for boarding "nights"
    if (rule.rule_data?.nights && service_type === 'boarding') {
      // Calculate number of nights
      const start = new Date(context.drop_off_day);
      const end = new Date(context.pick_up_day);
      const nights = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
      if (nights === rule.rule_data.nights) {
        if (rule.price_adjustment_type === 'set') price = rule.price_adjustment_value;
        else if (rule.price_adjustment_type === 'add') price += rule.price_adjustment_value;
        else if (rule.price_adjustment_type === 'percent') price += price * (rule.price_adjustment_value / 100);
        breakdown.push({
          id: rule.id,
          name: rule.name,
          rule_type: rule.rule_type,
          description: rule.description,
          adjustment: rule.price_adjustment_value,
          price_so_far: price
        });
        continue;
      }
    }
    // ...add more matching logic as needed for other fields/services
  }
  // Fallback: No rule matched? Return a price or an error.
  if (!breakdown.length) {
    return { error: 'No pricing rule matched.', missing_fields: [] };
  }
  return { price, breakdown };
}
