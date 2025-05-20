// src/pendingServices/services/pendingServicesService.js

const TABLE = 'pending_services';

/**
 * List all pending services for a given user.
 */
export async function listPendingServicesForUser(server, userId) {
  const { data, error } = await server.supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('service_date', { ascending: true });
  if (error) throw error;
  return data;
}

/**
 * Get a single pending service by id (must belong to user).
 */
export async function getPendingServiceForUser(server, userId, id) {
  const { data, error } = await server.supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

/**
 * Tenant: List all pending services for a specific client.
 */
export async function listPendingServicesForClient(server, clientId) {
  const { data, error } = await server.supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', clientId)
    .order('service_date', { ascending: true });
  if (error) throw error;
  return data;
}

/**
 * Delete a pending service for user by id.
 */
export async function deletePendingService(server, userId, id) {
  const { error } = await server.supabase
    .from(TABLE)
    .delete()
    .eq('user_id', userId)
    .eq('id', id);
  if (error) throw error;
}

/**
 * Tenant: Delete a pending service for a client (rare, but in case).
 */
export async function deletePendingServiceAsTenant(server, clientId, id) {
  const { error } = await server.supabase
    .from(TABLE)
    .delete()
    .eq('user_id', clientId)
    .eq('id', id);
  if (error) throw error;
}
