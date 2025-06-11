import { getDogIdsForBoardings } from './getDogIdsForBoardings.js';
const TABLE = 'boardings';

export async function listBoardings(server, { tenant_id, user_id, booking_id } = {}) {
  let query = server.supabase.from(TABLE).select('*');
  if (tenant_id) query = query.eq('tenant_id', tenant_id);
  if (user_id) query = query.eq('user_id', user_id);
  if (booking_id) query = query.eq('booking_id', booking_id);

  const { data, error } = await query;
  if (error) throw error;
  const boardingIds = data.map(b => b.id);
  const dogMap = await getDogIdsForBoardings(server, boardingIds);
  return data.map(b => ({
    ...b,
    dogs: dogMap[b.id] || [],
  }));
}
