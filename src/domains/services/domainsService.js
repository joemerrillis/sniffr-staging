export async function listDomains(fastify, tenantId) {
  let query = fastify.supabase.from('domains').select('id, tenant_id, domain, verified, created_at');
  if (tenantId) {
    query = query.eq('tenant_id', tenantId);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

export async function getDomainById(fastify, id) {
  const { data, error } = await fastify.supabase
    .from('domains')
    .select('id, tenant_id, domain, verified, created_at')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function createDomain(fastify, payload) {
  const { data, error } = await fastify.supabase
    .from('domains')
    .insert(payload)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateDomain(fastify, id, updates) {
  const { data, error } = await fastify.supabase
    .from('domains')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteDomain(fastify, id) {
  const { error } = await fastify.supabase
    .from('domains')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
  return;
}

export async function verifyDomain(fastify, id) {
  const { data, error } = await fastify.supabase
    .from('domains')
    .update({ verified: true })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}