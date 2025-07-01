import supabase from '../../core/supabase.js';

export async function createWalkReport(data) {
  const { data: report, error } = await supabase
    .from('walk_reports')
    .insert([data])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return report;
}

export async function updateWalkReport(id, updates) {
  const { data: report, error } = await supabase
    .from('walk_reports')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return report;
}

export async function getWalkReportById(id) {
  const { data: report, error } = await supabase
    .from('walk_reports')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return report;
}

export async function listWalkReports(filters = {}) {
  let query = supabase.from('walk_reports').select('*');
  Object.entries(filters).forEach(([key, value]) => {
    if (value) query = query.eq(key, value);
  });
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteWalkReport(id) {
  const { data, error } = await supabase
    .from('walk_reports')
    .delete()
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Fetch with joined events/memories for detailed report
export async function getWalkReportWithDetails(id) {
  const { data: report, error } = await supabase
    .from('walk_reports')
    .select(`
      *,
      dog_events (*),
      dog_memories (*)
    `)
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return report;
}
