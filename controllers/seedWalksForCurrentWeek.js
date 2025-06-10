import {{ previewPrice }} from '../../pricingRules/services/pricingEngine.js';
import {{
  listClientWalkWindows,
  getClientWalkWindow,
  createClientWalkWindow,
  updateClientWalkWindow,
  deleteClientWalkWindow,
  listWindowsForWeek,
  seedPendingWalksForWeek
}} from '../services/clientWalkWindowsService.js';
export default async function seedWalksForCurrentWeek(request, reply) {
  const userId = request.body.user_id || request.user?.id || request.user?.sub;
  console.log('[DEBUG:seedWalksForCurrentWeek] userId:', userId, '| request.user:', request.user);

  const today = new Date();
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (6 - today.getDay()));

  const seededCount = await seedPendingWalksForWeek(request.server, userId, today, endOfWeek);
  reply.send({ seeded: seededCount });
}
