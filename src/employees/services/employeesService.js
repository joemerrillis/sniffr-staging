const TABLE = 'employees';

export async function listEmployees(server) {
  const { data, error } = await server.supabase.from(TABLE).select('*');
  if (error) throw error;
  return data;
}

export async function getEmployee(server, id) {
  const { data, error } = await server.supabase.from(TABLE).select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function createEmployee(server, payload) {
  const { data, error } = await server.supabase.from(TABLE).insert([payload]).single();
  if (error) throw error;
  return data;
}

export async function updateEmployee(server, id, payload) {
  const { data, error } = await server.supabase.from(TABLE).update(payload).eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function deleteEmployee(server, id) {
  const { error } = await server.supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
}
