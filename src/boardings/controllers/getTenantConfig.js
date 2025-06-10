export default async function getTenantConfig(server, tenant_id) {
  const { data, error } = await server.supabase
    .from('tenants')
    .select('use_time_blocks, time_blocks_config')
    .eq('id', tenant_id)
    .single();
  if (error) throw new Error('Tenant not found');
  return data;
}
