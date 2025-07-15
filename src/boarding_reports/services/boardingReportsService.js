// src/boarding_reports/services/boardingReportsService.js

// Accepts: supabase (decorated client from Fastify, passed via context/request)
// All methods return results in the required envelope pattern:
//   - Single: { boarding_report: { ... } }
//   - Multiple: { boarding_reports: [ ... ] }

async function listBoardingReports(supabase, filters = {}) {
  // Supports optional filtering by boarding_id, dog_id, user_id, status, etc.
  let query = supabase.from('boarding_reports').select('*');
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined) query = query.eq(key, value);
  }
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return { boarding_reports: data };
}

async function getBoardingReport(supabase, id) {
  const { data, error } = await supabase
    .from('boarding_reports')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return { boarding_report: data };
}

async function createBoardingReport(supabase, payload) {
  // Validate all required foreign keys exist!
  await validateFKs(supabase, payload);

  const insertPayload = {
    ...payload,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('boarding_reports')
    .insert([insertPayload])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return { boarding_report: data };
}

async function updateBoardingReport(supabase, id, updates) {
  if (Object.keys(updates).length === 0) throw new Error('No update fields provided');
  // If updating FKs, validate them
  await validateFKs(supabase, updates, true);

  updates.updated_at = new Date().toISOString();
  const { data, error } = await supabase
    .from('boarding_reports')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return { boarding_report: data };
}

async function deleteBoardingReport(supabase, id) {
  const { data, error } = await supabase
    .from('boarding_reports')
    .delete()
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return { boarding_report: data };
}

// --- FK validation helper ---
async function validateFKs(supabase, data, isPartial = false) {
  // Only check keys present in the payload if isPartial=true (patch)
  // Otherwise, require all FKs for creation
  const checks = [
    { key: 'boarding_id', table: 'boardings' },
    { key: 'dog_id', table: 'dogs' },
    { key: 'user_id', table: 'users' },
  ];
  for (const { key, table } of checks) {
    if (isPartial && data[key] === undefined) continue;
    if (data[key]) {
      const { data: exists, error } = await supabase.from(table).select('id').eq('id', data[key]).maybeSingle();
      if (error) throw new Error(`FK check failed: ${error.message}`);
      if (!exists) throw new Error(`Invalid FK: ${key}=${data[key]} not found in ${table}`);
    }
  }
  // staff_ids: must be an array of user UUIDs; validate all if present
  if (data.staff_ids && Array.isArray(data.staff_ids)) {
    for (const staffId of data.staff_ids) {
      const { data: exists, error } = await supabase.from('users').select('id').eq('id', staffId).maybeSingle();
      if (error) throw new Error(`FK check failed: ${error.message}`);
      if (!exists) throw new Error(`Invalid staff_id: ${staffId} not found in users`);
    }
  }
  // photos: no FK, but if you want, can check dog_memories.id refs here as well
}

export {
  listBoardingReports,
  getBoardingReport,
  createBoardingReport,
  updateBoardingReport,
  deleteBoardingReport,
};
