import { v4 as uuidv4 } from 'uuid';

export async function listDogs(fastify, tenantId, ownerId) {
  let query = fastify.supabase
    .from('dogs')
    .select('id, tenant_id, owner_id, name, photo_url, birthdate, universal_profile_id, created_at');
  if (tenantId) query = query.eq('tenant_id', tenantId);
  if (ownerId) query = query.eq('owner_id', ownerId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

export async function getDogById(fastify, id) {
  const { data, error } = await fastify.supabase
    .from('dogs')
    .select('id, tenant_id, owner_id, name, photo_url, birthdate, universal_profile_id, created_at')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function createDog(fastify, payload) {
  const { data, error } = await fastify.supabase
    .from('dogs')
    .insert(payload)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateDog(fastify, id, updates) {
  const { data, error } = await fastify.supabase
    .from('dogs')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteDog(fastify, id) {
  const { error } = await fastify.supabase
    .from('dogs')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
  return;
}

// Generate a signed upload URL for a photo in R2
export async function generatePhotoUploadUrl(fastify, tenantId, dogId) {
  const key = `${tenantId}/${dogId}/${uuidv4()}.jpg`;
  const { url, method, headers } = await fastify.r2.getSignedUrl(key, {
    method: 'PUT',
    expiresIn: 300
  });
  const publicUrl = `${fastify.r2.publicEndpoint}/${key}`;
  return { uploadUrl: url, uploadMethod: method, uploadHeaders: headers, publicUrl };
}

// Stub for export media; actual streaming implemented in controller
export async function getOwnerMedia(fastify, ownerId) {
  const dogs = await listDogs(fastify, null, ownerId);
  return dogs.map(d => ({
    id: d.id,
    name: d.name,
    photo_url: d.photo_url,
    birthdate: d.birthdate
  }));
}