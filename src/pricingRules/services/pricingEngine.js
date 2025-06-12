// Helper for price adjustment
function applyAdjustment(price, rule) {
  switch (rule.price_adjustment_type) {
    case 'set': return rule.price_adjustment_value;
    case 'add': return price + rule.price_adjustment_value;
    case 'percent': return price + price * (rule.price_adjustment_value / 100);
    default:
      console.warn('[pricingEngine] Unknown price_adjustment_type', rule.price_adjustment_type, rule);
      return price;
  }
}

// Service-specific matchers
const serviceMatchers = {
  walk_window: (rule, context) => {
    if (!rule.rule_data) return false;
    for (const [k, v] of Object.entries(rule.rule_data)) {
      if (context[k] == null || String(context[k]) !== String(v)) {
        return false;
      }
    }
    return true;
  },
  boarding: (rule, context) => {
    if (!rule.rule_data?.nights) return false;
    const start = safeDate(context.drop_off_day);
    const end = safeDate(context.pick_up_day);
    if (!start || !end) return false;
    const nights = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
    return nights === rule.rule_data.nights;
  },
  // Add more service types here
};

export async function previewPrice(server, service_type, context) {
  try {
    // ... (field validation and DB fetch as before) ...

    let price = 0;
    const breakdown = [];

    for (const rule of rules) {
      let matched = false;
      const matcher = serviceMatchers[service_type];
      if (matcher) {
        matched = matcher(rule, context);
      } else {
        // Default fallback: always apply (or add generic logic)
        matched = true;
      }

      if (matched) {
        price = applyAdjustment(price, rule);
        breakdown.push({
          id: rule.id,
          name: rule.name,
          rule_type: rule.rule_type,
          description: rule.description,
          adjustment: rule.price_adjustment_value,
          price_so_far: price
        });
        // Optionally: break after set, or allow stacking
      }
    }

    if (!breakdown.length) {
      const noMatchMsg = 'No pricing rule matched.';
      console.warn('[pricingEngine] No rules matched', { context, rules });
      return { error: noMatchMsg, missing_fields: [] };
    }
    return { price, breakdown };

  } catch (err) {
    console.error('[pricingEngine] Unhandled exception:', err, { context, service_type });
    return {
      error: err.message || err.toString() || JSON.stringify(err),
      stack: err.stack,
      raw: err
    };
  }
}
