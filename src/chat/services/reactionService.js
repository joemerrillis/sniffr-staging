// src/chat/services/reactionService.js

export async function addReaction(supabase, message_id, user_id, emoji) {
  // Fetch, append, and update
  const { data: msg, error: fetchErr } = await supabase
    .from('chat_messages')
    .select('reactions')
    .eq('id', message_id)
    .single();
  if (fetchErr) throw fetchErr;
  const reactions = Array.isArray(msg.reactions) ? msg.reactions : [];
  if (reactions.find(r => r.user_id === user_id && r.emoji === emoji)) return msg;
  reactions.push({ user_id, emoji });
  const { data, error } = await supabase
    .from('chat_messages')
    .update({ reactions })
    .eq('id', message_id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function removeReaction(supabase, message_id, user_id, emoji) {
  const { data: msg, error: fetchErr } = await supabase
    .from('chat_messages')
    .select('reactions')
    .eq('id', message_id)
    .single();
  if (fetchErr) throw fetchErr;
  let reactions = Array.isArray(msg.reactions) ? msg.reactions : [];
  reactions = reactions.filter(r => !(r.user_id === user_id && r.emoji === emoji));
  const { data, error } = await supabase
    .from('chat_messages')
    .update({ reactions })
    .eq('id', message_id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
