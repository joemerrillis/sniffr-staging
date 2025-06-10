import { getDogIdsForWindows } from './getDogIdsForWindows.js';
export async function listWindowsForWeek(server, userId, weekStart) {
  const start = new Date(weekStart);
  const end   = new Date(start);
  end.setDate(end.getDate() + 6);
  const { data: all, error } = await server.supabase
    .from('client_walk_windows')
    .select('id, user_id, tenant_id, day_of_week, window_start, window_end, effective_start, effective_end, created_at, updated_at, walk_length_minutes')
    .eq('user_id', userId);
  if (error) throw error;
  const windowIds = all.map(w => w.id);
  const dogMap = await getDogIdsForWindows(server, windowIds);
  return all
    .filter(w => {
      const effStart = new Date(w.effective_start);
      const effEnd   = w.effective_end ? new Date(w.effective_end) : null;
      return effStart <= end && (!effEnd || effEnd >= start);
    })
    .map(w => ({
      ...w,
      dog_ids: dogMap[w.id] || [],
    }));
}