// src/daycare_sessions/helpers/needsApproval.js
export default async function needsApproval(server, tenant_id, dog_ids, session_date) {
  // Check if any dog has negative overlap on the date
  const { data, error } = await server.supabase
    .from('dog_cohort_overlap')
    .select('dog_id, co_dog_id, sentiment')
    .in('dog_id', dog_ids)
    .eq('session_date', session_date)
    .eq('sentiment', 'negative');

  if (error) {
    console.error('[DaycareNeedsApproval] Error checking dog_cohort_overlap:', error);
    // Be safe: require approval if can't check
    return true;
  }

  return data && data.length > 0;
}
