// src/daycare_sessions/helpers/needsApproval.js

export default async function needsApproval(server, tenant_id, dog_ids, session_date) {
  // session_date format: "YYYY-MM-DD"
  // Only look at negative overlaps for the same tenant
  const { data, error } = await server.supabase
    .from('dog_cohort_overlap')
    .select('dog_id, co_dog_id, sentiment, overlap_start, overlap_end')
    .eq('tenant_id', tenant_id)
    .in('dog_id', dog_ids)
    .eq('sentiment', 'negative')
    .lte('overlap_start', session_date)
    .gte('overlap_end', session_date);

  if (error) {
    console.error('[DaycareNeedsApproval] Error checking dog_cohort_overlap:', error);
    // Be safe: require approval if can’t check
    return true;
  }

  return data && data.length > 0;
}
