// src/clientWalkRequests/services/getDogIdsForRequests.js
export default async function getDogIdsForRequests(server, requestIds) {
  if (!requestIds.length) return {};
  const { data, error } = await server.supabase
    .from('service_dogs')
    .select('service_id, dog_id')
    .eq('service_type', 'client_walk_request')
    .in('service_id', requestIds);
  if (error) throw error;
  const mapping = {};
  for (const row of data) {
    if (!mapping[row.service_id]) mapping[row.service_id] = [];
    mapping[row.service_id].push(row.dog_id);
  }
  return mapping;
}
