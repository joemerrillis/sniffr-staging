import { getDogIdsForWindows } from './getDogIdsForWindows.js';
export async function listClientWalkWindows(server, userId) {
  const { data, error } = await server.supabase
    .from('client_walk_windows')
    .select('id, user_id, tenant_id, day_of_week, window_start, window_end, effective_start, effective_end, created_at, updated_at, walk_length_minutes')
    .eq('user_id', userId);
  if (error) throw error;
  const windowIds = data.map(w => w.id);
  const dogMap = await getDogIdsForWindows(server, windowIds);
  return data.map(w => ({
    ...w,
    dog_ids: dogMap[w.id] || [],
  }));
}