// src/households/services/householdMemberService.js

export async function listMembers(supabase, household_id) {
  const { data, error } = await supabase
    .from('household_members')
    .select('*')
    .eq('household_id', household_id);
  if (error) throw error;
  return data;
}

export async function addMember(supabase, household_id, user_id, role = null) {
  const { data, error } = await supabase
    .from('household_members')
    .insert([{ household_id, user_id, role, status: 'active' }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function removeMember(supabase, household_id, user_id) {
  const { error } = await supabase
    .from('household_members')
    .delete()
    .eq('household_id', household_id)
    .eq('user_id', user_id);
  if (error) throw error;
  return { success: true };
}
