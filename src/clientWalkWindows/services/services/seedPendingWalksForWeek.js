export async function seedPendingWalksForWeek(server, userId, startDate, endDate) {
  const { data: windows, error } = await server.supabase
    .from('client_walk_windows')
    .select('id, user_id, tenant_id, day_of_week, window_start, window_end, effective_start, effective_end, created_at, updated_at, walk_length_minutes')
    .eq('user_id', userId);
  if (error) throw error;
  const days = [];
  let current = new Date(startDate);
  while (current <= endDate) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  let created = 0;
  for (const day of days) {
    const dow = day.getDay();
    const dayStr = day.toISOString().slice(0, 10);
    windows
      .filter(w =>
        Number(w.day_of_week) === dow &&
        new Date(w.effective_start) <= day &&
        (!w.effective_end || new Date(w.effective_end) >= day)
      )
      .forEach(async w => {
        const { data: dogs } = await server.supabase
          .from('service_dogs')
          .select('dog_id')
          .eq('service_type', 'client_walk_window')
          .eq('service_id', w.id);
        const dog_ids = dogs ? dogs.map(d => d.dog_id) : [];
        const { data: exists } = await server.supabase
          .from('pending_services')
          .select('id')
          .eq('user_id', userId)
          .eq('service_date', dayStr)
          .eq('walk_window_id', w.id)
          .maybeSingle();
        if (!exists) {
          await server.supabase
            .from('pending_services')
            .insert([{
              user_id: userId,
              tenant_id: w.tenant_id,
              service_date: dayStr,
              service_type: 'walk_window',
              walk_window_id: w.id,
              dog_ids,
              details: {
                dow: w.day_of_week,
                start: w.window_start,
                end: w.window_end,
                walk_length_minutes: w.walk_length_minutes
              },
              is_confirmed: false,
              created_at: new Date().toISOString()
            }]);
          created++;
        }
      });
  }
  return created;
}