import dns from 'dns/promises';

export async function listDomains(fastify, tenantId) {
  let query = fastify.supabase
    .from('domains')
    .select('id, tenant_id, domain, verified, created_at');
  if (tenantId) query = query.eq('tenant_id', tenantId);
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

/**
 * Verify that the DNS CNAME for the domain actually points to CNAME_TARGET.
 */
export async function verifyDomain(fastify, id) {
  // 1. Fetch the domain
  const { data: domainRow, error: fetchError } = await fastify.supabase
    .from('domains')
    .select('domain')
    .eq('id', id)
    .single();
  if (fetchError || !domainRow) {
    throw new Error(fetchError?.message || 'Domain not found');
  }

  const fqdn     = domainRow.domain;               // e.g. 'app.hamiltonbark.com'
  const expected = process.env.CNAME_TARGET;       // must be set in env

  if (!expected) {
    throw new Error('Missing CNAME_TARGET in environment');
  }

  // 2. Perform the CNAME lookup
  let cnames;
  try {
    cnames = await dns.resolveCname(fqdn);
  } catch (err) {
    throw new Error(`DNS lookup failed for ${fqdn}: ${err.code || err.message}`);
  }

  // 3. Check the result
  if (!cnames.includes(expected)) {
    throw new Error(
      `CNAME for ${fqdn} points to [${cnames.join(', ')}], not to ${expected}`
    );
  }

  // 4. Mark verified
  const { data, error: updateError } = await fastify.supabase
    .from('domains')
    .update({ verified: true })
    .eq('id', id)
    .select()
    .single();
  if (updateError) throw new Error(updateError.message);
  return data;
}
