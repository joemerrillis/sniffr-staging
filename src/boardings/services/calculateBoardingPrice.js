// src/boardings/services/boardingPricingService.js

/**
 * Calculate a boarding price using tenant-defined rules.
 * @param {Object} server         Fastify/Supabase server
 * @param {String} tenant_id      Tenant UUID
 * @param {Object} boardingData   { dogs, drop_off_day, pick_up_day, ... }
 * @returns {Object} { price, breakdown }
 */
export async function calculateBoardingPrice(server, tenant_id, boardingData) {
  const { data: rules, error } = await server.supabase
    .from('boarding_pricing_rules')
    .select('*')
    .eq('tenant_id', tenant_id)
    .eq('enabled', true)
    .order('priority', { ascending: true });

  if (error) throw new Error("Failed to load pricing rules: " + error.message);

  let price = 0;
  const breakdown = [];

  for (const rule of rules) {
    let applies = false;
    let adjustment = 0;

    switch (rule.rule_type) {
      case 'base':
        // Always applies first; set base price.
        price = Number(rule.price_adjustment_value);
        applies = true;
        adjustment = price;
        break;

      case 'multi-dog':
        if ((boardingData.dogs?.length || 1) >= (rule.rule_data?.min_dogs || 2)) {
          applies = true;
          if (rule.price_adjustment_type === 'percent') {
            adjustment = price * (Number(rule.price_adjustment_value) / 100);
          } else {
            adjustment = Number(rule.price_adjustment_value);
          }
          price += adjustment;
        }
        break;

      case 'weekend':
        {
          // Apply if dropoff or pickup falls on a weekend (0 = Sunday, 6 = Saturday)
          const days = rule.rule_data?.days || [0, 6];
          const dropOffDay = (new Date(boardingData.drop_off_day)).getDay();
          const pickUpDay = (new Date(boardingData.pick_up_day)).getDay();
          if (days.includes(dropOffDay) || days.includes(pickUpDay)) {
            applies = true;
            adjustment = Number(rule.price_adjustment_value);
            price += adjustment;
          }
        }
        break;

      case 'length_of_stay':
        {
          const nights =
            (new Date(boardingData.pick_up_day) - new Date(boardingData.drop_off_day)) /
            (1000 * 60 * 60 * 24);
          if (nights >= (rule.rule_data?.min_nights || 1)) {
            applies = true;
            if (rule.price_adjustment_type === 'percent') {
              adjustment = price * (Number(rule.price_adjustment_value) / 100);
            } else {
              adjustment = Number(rule.price_adjustment_value);
            }
            price += adjustment;
          }
        }
        break;

      // Add more rule types as needed!

      default:
        // Unknown rule, skip
        break;
    }

    if (applies) {
      breakdown.push({
        id: rule.id,
        name: rule.name,
        rule_type: rule.rule_type,
        description: rule.description,
        adjustment,
        price_so_far: price,
      });
    }
  }

  return { price: Math.round(price * 100) / 100, breakdown };
}
