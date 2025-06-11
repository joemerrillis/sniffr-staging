import { calculateBoardingPrice } from '../services/calculateBoardingPrice.js';

/**
 * POST /boardings/preview-price
 * Body: { tenant_id, dogs, drop_off_day, pick_up_day, ... }
 */
export async function previewBoardingPrice(request, reply) {
  try {
    const { tenant_id, dogs, drop_off_day, pick_up_day } = request.body;
    if (!tenant_id || !drop_off_day || !pick_up_day) {
      return reply.code(400).send({ error: 'Missing required fields.' });
    }

    // Add more fields as needed for your pricing logic
    const { price, breakdown } = await calculateBoardingPrice(request.server, tenant_id, {
      dogs,
      drop_off_day,
      pick_up_day,
      // ...other future fields
    });

    reply.send({ suggested_price: price, breakdown });
  } catch (err) {
    reply.code(500).send({ error: err.message || err });
  }
}
