// src/clientWalkRequests/services/getClientWalkRequest.js
export default async function getClientWalkRequest(server, userId, id) {
  const { data, error } = await server.supabase
    .from('client_walk_requests')
    .select('*')
    .eq('user_id', userId)
    .eq('id', id)
    .single();
  if (error) throw error;

  const { data: dogs, error: dogError } = await server.supabase
    .from('service_dogs')
    .select('dog_id')
    .eq('service_type', 'client_walk_request')
    .eq('service_id', id);
  if (dogError) throw dogError;

  return {
    ...data,
    dog_ids: dogs ? dogs.map(d => d.dog_id) : [],
  };
}
