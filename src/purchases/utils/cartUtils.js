// src/purchases/utils/cartUtils.js

export async function fetchCartServices(server, cart, logger) {
  logger('Fetching pending_services for cart:', cart);
  const { data, error } = await server.supabase
    .from('pending_services')
    .select('*')
    .in('id', cart);
  logger('Cart fetch result:', data, '| error:', error);
  if (error) throw new Error('DB error fetching cart items: ' + error.message);
  return data;
}

export function buildPriceContext(serviceRow, logger) {
  let day_of_week = serviceRow.day_of_week;
  if (!day_of_week && serviceRow.service_date) {
    day_of_week = new Date(serviceRow.service_date).getDay();
  }

  let window_start = serviceRow.window_start;
  if (!window_start && serviceRow.details?.start) window_start = serviceRow.details.start;

  let hours;
  if (serviceRow.service_type === 'daycare') {
    const drop = serviceRow.drop_off_time || serviceRow.details?.drop_off_time;
    const pick = serviceRow.expected_pick_up_time || serviceRow.details?.expected_pick_up_time;
    if (drop && pick) {
      const [dh, dm] = drop.split(':').map(Number);
      const [ph, pm] = pick.split(':').map(Number);
      hours = (ph + pm / 60) - (dh + dm / 60);
      if (hours < 0) hours += 24;
      hours = Math.round(hours * 100) / 100;
    }
  }

  const context = {
    tenant_id: serviceRow.tenant_id,
    user_id: serviceRow.user_id,
    dog_ids: serviceRow.dog_ids || [],
    walk_length_minutes: serviceRow.walk_length_minutes || serviceRow.details?.walk_length_minutes,
    day_of_week,
    window_start,
    service_date: serviceRow.service_date,
    hours,
    ...serviceRow.details,
    __raw: serviceRow
  };
  logger('Price context for serviceRow', serviceRow.id, ':', context);
  return context;
}


export function groupCartServices(services) {
  const grouped = {};

  for (const service of services) {
    let groupKey = service.service_type;

    // Special split for walk_window by id type
if (service.service_type === 'walk_window') {
  if (service.walk_window_id) {
    groupKey = 'walk_window:walk_window_id';
  } else if (service.request_id) {
    groupKey = 'walk_window:request_id';
  } else {
    groupKey = 'walk_window:unknown';
  }
}

    if (!grouped[groupKey]) grouped[groupKey] = [];
    grouped[groupKey].push(service);
  }

  return grouped;
}


export async function enrichCartGroup(server, group, previewPrice, logger) {
  let total = 0;
  let allBreakdown = [];
  const enrichedCart = await Promise.all(
    group.map(async (row) => {
      logger('Processing cart item:', row.id, row);
      const context = buildPriceContext(row, logger);
      let service_type = row.service_type || context.service_type || 'walk_window';
      logger('Previewing price for service_type:', service_type, '| context:', context);
      const pricePreview = await previewPrice(server, service_type, context);
      logger('Price preview result:', pricePreview);

      const price = pricePreview.price ?? 0;
      total += price;
      allBreakdown.push({
        pending_service_id: row.id,
        ...pricePreview
      });
      return {
        ...row,
        price_preview: pricePreview
      };
    })
  );
  // Assumes all in group have same type/tenant
  const tenant_id = group[0].tenant_id;
  const type = group[0].service_type;
  return {
    enrichedCart,
    total,
    breakdown: allBreakdown,
    tenant_id,
    type,
  };
}
