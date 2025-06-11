export async function getDogIdsForBoardings(server, boardingIds) {
  if (!boardingIds.length) return {};
  const { data, error } = await server.supabase
    .from('service_dogs')
    .select('service_id, dog_id')
    .eq('service_type', 'boarding')
    .in('service_id', boardingIds);
  if (error) throw error;
  const mapping = {};
  for (const row of data) {
    if (!mapping[row.service_id]) mapping[row.service_id] = [];
    mapping[row.service_id].push(row.dog_id);
  }
  return mapping;
}
