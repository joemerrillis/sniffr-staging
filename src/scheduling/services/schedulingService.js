// Pseudocode – flesh out as needed for your ORM/Supabase
export async function getWalkSchedulesForWeek(server, tenant_id, week_start) {
  // Get all walks for the tenant that week (any status except canceled)
  // Use week_start + 6 days as end
  // Return walks with all relevant fields
}

export async function batchConfirmWalksForDay(server, tenant_id, date) {
  // Set status='scheduled', is_confirmed=true for all 'draft' walks on this day
  // Trigger notifications
}

export async function updateWalkSchedule(server, walk_id, payload) {
  // Update time/walker for this walk
  // If change is OUTSIDE client window, set status='pending_client_approval', needs_client_approval=true
  // Trigger client notification if approval needed
}

export async function approveWalkChange(server, walk_id) {
  // Set status='approved', is_confirmed=true, needs_client_approval=false
  // Trigger tenant notification
}
