// src/clientWalkRequests/services/listClientWalkRequests.js
import getDogIdsForRequests from './getDogIdsForRequests.js';

export default async function listClientWalkRequests(server, userId) {
  const { data, error } = await server.supabase
    .from('client_walk_requests')
    .select('*')
    .eq('user_id', userId)
    .order('walk_date', { ascending: true });
  if (error) throw error;

  const requestIds = data.map(req => req.id);
  const dogMap = await getDogIdsForRequests(server, requestIds);

  return data.map(req => ({
    ...req,
    dog_ids: dogMap[req.id] || [],
  }));
}
