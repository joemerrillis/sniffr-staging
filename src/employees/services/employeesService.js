// src/employees/services/employeesService.js
const TABLE = 'employees';

/**
 * List all employee rows.
 * @returns {Promise<Object[]>} array of employee records
 */
export async function listEmployees(server) {
  const { data, error } = await server.supabase
    .from(TABLE)
    .select('*');
  if (error) throw error;
  return data;
}

/**
 * Fetch a single employee by id.
 * @param {string} id employee.uuid
 * @returns {Promise<Object>} employee record
 */
export async function getEmployee(server, id) {
  const { data, error } = await server.supabase
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

/**
 * Insert a new employee and return the full inserted row.
 * @param {Object} payload { tenant_id, user_id, is_primary }
 * @returns {Promise<Object>} the newly created employee record
 */
export async function createEmployee(server, payload) {
  const { data, error } = await server.supabase
    .from(TABLE)
    .insert([payload], { returning: 'representation' })
    .single();
  if (error) throw error;
  return data;
}

/**
 * Update an existing employee and return the updated row.
 * @param {string} id employee.uuid
 * @param {Object} payload fields to update
 * @returns {Promise<Object>} the updated employee record
 */
export async function updateEmployee(server, id, payload) {
  const { data, error } = await server.supabase
    .from(TABLE)
    .update(payload, { returning: 'representation' })
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

/**
 * Delete an employee and return the deleted row.
 * @param {string} id employee.uuid
 * @returns {Promise<Object>} the deleted employee record
 */
export async function deleteEmployee(server, id) {
  const { data, error } = await server.supabase
    .from(TABLE)
    .delete({ returning: 'representation' })
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}
