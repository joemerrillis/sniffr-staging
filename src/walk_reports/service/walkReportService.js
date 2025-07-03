// src/walk_reports/service/walkReportService.js

// All functions receive the fastify-decorated `supabase` as first parameter!

export async function createWalkReport(supabase, data) {
  // Insert the walk report and return the inserted row (first in array)
  const { data: rows, error } = await supabase
    .from('walk_reports')
    .insert([data])
    .select();

  if (error) throw new Error(error.message);
  return rows && rows[0]; // Return first inserted row for envelope
}

export async function updateWalkReport(supabase, id, updates) {
  const { data: rows, error } = await supabase
    .from('walk_reports')
    .update(updates)
    .eq('id', id)
    .select();

  if (error) throw new Error(error.message);
  return rows && rows[0]; // Return first updated row
}

export async function getWalkReportById(supabase, id) {
  const { data: rows, error } = await supabase
    .from('walk_reports')
    .select('*')
    .eq('id', id);

  if (error) throw new Error(error.message);
  if (!rows || rows.length === 0) return null;
  return rows[0];
}

export async function listWalkReports(supabase, filters = {}) {
  let query = supabase.from('walk_reports').select('*');
  Object.entries(filters).forEach(([key, value]) => {
    if (value) query = query.eq(key, value);
  });
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

export async function deleteWalkReport(supabase, id) {
  const { data: rows, error } = await supabase
    .from('walk_reports')
    .delete()
    .eq('id', id)
    .select();

  if (error) throw new Error(error.message);
  return rows && rows[0]; // Return deleted row (if any)
}

// Fetch with joined events/memories for detailed report
export async function getWalkReportWithDetails(supabase, id) {
  const { data: rows, error } = await supabase
    .from('walk_reports')
    .select(`
      *,
      dog_events (*),
      dog_memories (*)
    `)
    .eq('id', id);

  if (error) throw new Error(error.message);
  if (!rows || rows.length === 0) return null;
  return rows[0];
}
