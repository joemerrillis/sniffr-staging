// src/chat/services/participantService.js

/**
 * Add a participant to a chat.
 * @param {object} supabase
 * @param {string} chat_id
 * @param {string} user_id
 * @param {string|null} role
 */
export async function addParticipant(supabase, chat_id, user_id, role = null) {
  const { data, error } = await supabase
    .from('chat_participants')
    .insert([{ chat_id, user_id, role }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Remove a participant from a chat.
 * @param {object} supabase
 * @param {string} chat_id
 * @param {string} user_id
 */
export async function removeParticipant(supabase, chat_id, user_id) {
  const { error } = await supabase
    .from('chat_participants')
    .delete()
    .eq('chat_id', chat_id)
    .eq('user_id', user_id);
  if (error) throw error;
  return { success: true };
}

/**
 * (Optional) Batch add participants. 
 * Usage: await addParticipants(supabase, chat_id, [{user_id, role}, ...])
 */
export async function addParticipants(supabase, chat_id, participants) {
  if (!participants?.length) return [];
  const rows = participants.map(({ user_id, role }) => ({
    chat_id,
    user_id,
    role: role || null,
  }));
  const { data, error } = await supabase
    .from('chat_participants')
    .insert(rows);
  if (error) throw error;
  return data;
}
