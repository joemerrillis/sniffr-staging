// src/chat/services/participantService.js

export async function addParticipant(supabase, chat_id, user_id, role = null) {
  const { data, error } = await supabase
    .from('chat_participants')
    .insert([{ chat_id, user_id, role }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function removeParticipant(supabase, chat_id, user_id) {
  const { error } = await supabase
    .from('chat_participants')
    .delete()
    .eq('chat_id', chat_id)
    .eq('user_id', user_id);
  if (error) throw error;
  return { success: true };
}
