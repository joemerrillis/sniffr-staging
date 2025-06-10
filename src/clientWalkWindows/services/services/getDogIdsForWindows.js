// Fetch dog_ids for a set of walk window IDs
export async function getDogIdsForWindows(server, windowIds) {
  if (!windowIds.length) return {};
  const { data, error } = await server.supabase
    .from('service_dogs')
    .select('service_id, dog_id')
    .eq('service_type', 'client_walk_window')
    .in('service_id', windowIds);
  if (error) throw error;
  const mapping = {};
  for (const row of data) {
    if (!mapping[row.service_id]) mapping[row.service_id] = [];
    mapping[row.service_id].push(row.dog_id);
  }
  return mapping;
}