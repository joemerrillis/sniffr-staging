// src/domains/services/domainsService.js
import dns from 'dns/promises';

/**
 * Verify that the DNS CNAME for the domain actually points to CNAME_TARGET.
 */
export async function verifyDomain(fastify, id) {
  // 1. Fetch the domain row
  const { data: domainRow, error: fetchError } = await fastify.supabase
    .from('domains')
    .select('domain')
    .eq('id', id)
    .single();
  if (fetchError || !domainRow) {
    throw new Error(fetchError?.message || 'Domain not found');
  }

  const fqdn = domainRow.domain;                        // e.g. 'app.hamiltonbark.com'
  const expected = process.env.CNAME_TARGET;             // from env

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

  // 3. Check if any of the returned CNAMEs match exactly
  if (!cnames.includes(expected)) {
    throw new Error(
      `CNAME for ${fqdn} points to [${cnames.join(', ')}], not to ${expected}`
    );
  }

  // 4. All good—update verified flag
  const { data, error: updateError } = await fastify.supabase
    .from('domains')
    .update({ verified: true })
    .eq('id', id)
    .select()
    .single();
  if (updateError) {
    throw new Error(updateError.message);
  }
  return data;
}
