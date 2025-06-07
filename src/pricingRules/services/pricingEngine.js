// src/pricingRules/services/pricingEngine.js

import { serviceTypeRequiredFields } from './requiredFields.js';

function safeDate(input, fallback = null) {
  try {
    const d = new Date(input);
    return isNaN(d.getTime()) ? fallback : d;
  } catch (e) {
    return fallback;
  }
}

export async function previewPrice(server, service_type, context) {
  try {
    // 1. Validate fields
    const missing = [];
    const required = serviceTypeRequiredFields[service_type] || [];
    for (const f of required) {
      if (!(f in context) || context[f] === undefined || context[f] === null) {
        missing.push(f);
      }
    }
    if (missing.length > 0) {
      const errMsg = `Missing required fields: ${missing.join(', ')}`;
      console.error('[pricingEngine] Input validation error:', errMsg, { context });
      return { error: errMsg, missing_fields: missing };
    }

    // 2. Fetch rules for this tenant & service_type
    let rules, error;
    try {
      const dbResult = await server.supabase
        .from('pricing_rules')
        .select('*')
        .eq('tenant_id', context.tenant_id)
        .eq('rule_type', service_type)
        .eq('enabled', true)
        .order('priority', { ascending: true });

      rules = dbResult.data;
      error = dbResult.error;
    } catch (err) {
      console.error('[pricingEngine] DB call threw exception:', err, { context });
      return { error: 'Database error occurred', details: err.message || err.toString() };
    }
    if (error) {
      console.error('[pricingEngine] DB returned error:', error, { context });
      return { error: error.message || JSON.stringify(error) };
    }
    if (!rules || !Array.isArray(rules)) {
      console.error('[pricingEngine] Fetched rules is not an array', { rules, context });
      return { error: 'No pricing rules found or rules fetch error.' };
    }

    // 3. Run rule engine
    let price = 0;
    const breakdown = [];
    let matched = false;

    for (const rule of rules) {
      try {
        // Boarding logic: example
        if (rule.rule_data?.nights && service_type === 'boarding') {
          // Calculate number of nights
          const start = safeDate(context.drop_off_day);
          const end = safeDate(context.pick_up_day);
          if (!start || !end) {
            const dateErr = `Invalid drop_off_day or pick_up_day: ${context.drop_off_day}, ${context.pick_up_day}`;
            console.error('[pricingEngine] Date parse error:', dateErr, { context, rule });
            return { error: dateErr, details: { drop_off_day: context.drop_off_day, pick_up_day: context.pick_up_day } };
          }
          const nights = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
          if (nights === rule.rule_data.nights) {
            matched = true;
            if (rule.price_adjustment_type === 'set') price = rule.price_adjustment_value;
            else if (rule.price_adjustment_type === 'add') price += rule.price_adjustment_value;
            else if (rule.price_adjustment_type === 'percent') price += price * (rule.price_adjustment_value / 100);
            else {
              console.warn('[pricingEngine] Unknown price_adjustment_type', rule.price_adjustment_type, rule);
            }
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
        // --- Add more service-specific and generic rule matching logic here! ---
      } catch (e) {
        console.error('[pricingEngine] Exception in rule engine loop:', e, { context, rule });
        breakdown.push({
          id: rule.id,
          name: rule.name,
          rule_type: rule.rule_type,
          description: `Rule failed to apply: ${e.message}`,
          adjustment: 0,
          price_so_far: price
        });
      }
    }

    // 4. Fallback: No rules matched
    if (!breakdown.length) {
      const noMatchMsg = 'No pricing rule matched.';
      console.warn('[pricingEngine] No rules matched', { context, rules });
      return { error: noMatchMsg, missing_fields: [] };
    }

    // 5. Success
    return { price, breakdown };

  } catch (err) {
    // Top-level exception handler
    console.error('[pricingEngine] Unhandled exception:', err, { context, service_type });
    return {
      error: err.message || err.toString() || JSON.stringify(err),
      stack: err.stack,
      raw: err
    };
  }
}
