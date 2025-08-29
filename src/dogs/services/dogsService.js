// src/dogs/services/dogsService.js

const TABLE = 'dogs';
const PHOTO_BUCKET = process.env.DOG_PHOTO_BUCKET || 'dog_photos';

/**
 * List all dogs accessible within a tenant context
 * Dogs are accessible if their owners are clients of the tenant
 */
export async function listDogsForTenant(server, tenantId) {
  // First, get all client user IDs for this tenant
  const { data: tenantClients, error: clientError } = await server.supabase
    .from('tenant_clients')
    .select('client_id')
    .eq('tenant_id', tenantId)
    .eq('accepted', true);
    
  if (clientError) throw clientError;
  
  if (!tenantClients || tenantClients.length === 0) {
    return []; // No clients for this tenant
  }
  
  const clientIds = tenantClients.map(tc => tc.client_id);
  
  // Then, get all dogs owned by these clients
  const { data: dogs, error: dogsError } = await server.supabase
    .from(TABLE)
    .select(`
      id,
      name,
      breed,
      age,
      weight,
      color,
      gender,
      fixed,
      medications,
      allergies,
      notes,
      household_id,
      created_at,
      updated_at,
      dog_owners!inner (user_id)
    `)
    .in('dog_owners.user_id', clientIds);
    
  if (dogsError) throw dogsError;
  
  // Clean the data to remove the joined relationship data
  return dogs.map(dog => {
    const { dog_owners, ...cleanDog } = dog;
    return cleanDog;
  });
}

/**
 * List all dogs (legacy - for backwards compatibility)
 */
export async function listDogs(server) {
  const { data, error } = await server.supabase
    .from(TABLE)
    .select('*');
  if (error) throw error;
  return data;
}

/**
 * Get a single dog by ID
 */
export async function getDog(server, id) {
  const { data, error } = await server.supabase
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

/**
 * Create a new dog record
 */
export async function createDog(server, payload) {
  const { data, error } = await server.supabase
    .from(TABLE)
    .insert([payload])
    .select('*')   // return full row
    .single();
  if (error) throw error;
  return data;
}

/**
 * Create a dog-owner relationship (link dog to user)
 * Always sets role to 'owner'.
 */
export async function createDogOwner(server, { dog_id, user_id }) {
  const { data, error } = await server.supabase
    .from('dog_owners')
    .insert([{ dog_id, user_id, role: 'owner' }])
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

/**
 * Update an existing dog
 */
export async function updateDog(server, id, payload) {
  const { data, error } = await server.supabase
    .from(TABLE)
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

/**
 * Delete a dog record
 */
export async function deleteDog(server, id) {
  const { error } = await server.supabase
    .from(TABLE)
    .delete()
    .eq('id', id);
  if (error) throw error;
}

/**
 * Generate a signed upload URL for a dog's photo
 */
export async function generatePhotoUploadUrl(server, dogId) {
  const { signedURL, error } = await server.supabase
    .storage
    .from(PHOTO_BUCKET)
    .createSignedUploadUrl(
      `${dogId}`,   // use dogId as object key
      60            // expires in 60 seconds
    );
  if (error) throw error;
  return signedURL;
}
