// src/dogs/services/dogsService.js

const TABLE = 'dogs';
const PHOTO_BUCKET = process.env.DOG_PHOTO_BUCKET || 'dog_photos';

/**
 * List all dogs
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
 * Update an existing dog
 */
export async function updateDog(server, id, payload) {
  const { data, error } = await server.supabase
    .from(TABLE)
    .update(payload)
    .select('*')
    .eq('id', id)
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
