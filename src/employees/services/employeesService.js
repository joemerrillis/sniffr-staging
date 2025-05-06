// src/employees/services/employeesService.js
const TABLE = 'employees';

export async function listEmployees(server) {
  const { data, error } = await server.supabase
    .from(TABLE)
    .select('*');
  if (error) throw error;
  return data;
}

export async function getEmployee(server, id) {
  const { data, error } = await server.supabase
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createEmployee(server, payload) {
  const { data, error } = await server.supabase
    .from(TABLE)
    .insert([payload], { returning: 'representation' })
    .select('*')             // ← this forces the returned columns
    .single();
  if (error) throw error;
  return data;
}

export async function updateEmployee(server, id, payload) {
  const { data, error } = await server.supabase
    .from(TABLE)
    .update(payload, { returning: 'representation' })
    .select('*')             // ← select the updated row
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function deleteEmployee(server, id) {
  const { data, error } = await server.supabase
    .from(TABLE)
    .delete({ returning: 'representation' })
    .select('*')             // ← select the deleted row
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}
