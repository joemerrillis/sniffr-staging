// src/clientWalkRequests/services/deleteClientWalkRequest.js
import { log } from './logger.js';

export default async function deleteClientWalkRequest(server, userId, id) {
  const { error } = await server.supabase
    .from('client_walk_requests')
    .delete()
    .eq('user_id', userId)
    .eq('id', id);
  if (error) throw error;
  log('Deleted client_walk_request:', id);
}
