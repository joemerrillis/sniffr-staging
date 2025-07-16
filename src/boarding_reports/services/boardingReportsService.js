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
  return { boarding_reports: data || [] };
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

  const now = new Date().toISOString();
  const start_time = payload.start_time || now;
  // end_time: use payload value if present, otherwise undefined (left blank in DB)

  const insertPayload = {
    ...payload,
    start_time,
    created_at: now,
    updated_at: now,
  };

  // Only add end_time if present (avoid overwriting DB default/null)
  if ('end_time' in payload) {
    insertPayload.end_time = payload.end_time;
  }

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

// --------- EXTRA ROUTES: COMPLETE-TASK & PUSH-TO-CLIENT ---------

async function completeBoardingReportTask(supabase, id, taskKey, completedBy, timestamp) {
  // 1. Fetch the report
  const { data: report, error } = await supabase
    .from('boarding_reports')
    .select('tasks')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  if (!report) throw new Error('Boarding report not found.');

  // 2. Find and update the task atomically
  const updatedTasks = (report.tasks || []).map(task =>
    task.key === taskKey
      ? {
          ...task,
          completed: true,
          completed_at: timestamp || new Date().toISOString(),
          completed_by: completedBy
        }
      : task
  );

  // 3. Save updated tasks
  const { data: updated, error: upError } = await supabase
    .from('boarding_reports')
    .update({
      tasks: updatedTasks,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();
  if (upError) throw new Error(upError.message);
  return { boarding_report: updated };
}

async function pushBoardingReportToClient(supabase, id, type, message) {
  // Optionally: fetch the report and do any extra logic (like setting status, flag, or audit log)
  // Here, just a placeholder for real notification integration
  // You might want to update a "pushed_to_client_at" or status field here, or trigger a notification

  // Example: set a "last_pushed_to_client" timestamp (optional)
  const updatePayload = { updated_at: new Date().toISOString() };
  // Optionally: status, or audit log

  await supabase
    .from('boarding_reports')
    .update(updatePayload)
    .eq('id', id);

  // Simulate notification logic (external integration would go here)
  // For now, always return success
  return { success: true };
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
  // photos: no FK, but you could check dog_memories.id refs here if needed
}

export {
  listBoardingReports,
  getBoardingReport,
  createBoardingReport,
  updateBoardingReport,
  deleteBoardingReport,
  completeBoardingReportTask,
  pushBoardingReportToClient
};
