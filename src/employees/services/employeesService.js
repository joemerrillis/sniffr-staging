const TABLE = 'employees';

exports.listEmployees = async (server) => {
  const { data, error } = await server.supabase.from(TABLE).select('*');
  if (error) throw error;
  return data;
};

exports.getEmployee = async (server, id) => {
  const { data, error } = await server.supabase.from(TABLE).select('*').eq('id', id).single();
  if (error) throw error;
  return data;
};

exports.createEmployee = async (server, payload) => {
  const { data, error } = await server.supabase.from(TABLE).insert([payload]).single();
  if (error) throw error;
  return data;
};

exports.updateEmployee = async (server, id, payload) => {
  const { data, error } = await server.supabase.from(TABLE).update(payload).eq('id', id).single();
  if (error) throw error;
  return data;
};

exports.deleteEmployee = async (server, id) => {
  const { error } = await server.supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
};
