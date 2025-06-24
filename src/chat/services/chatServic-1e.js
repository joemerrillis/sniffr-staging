// src/chat/services/chatService.js

// Note: Assume supabase client is available in your context (e.g., fastify.supabase or passed in as a param).

export async function createChat(supabase, payload) {
  // payload: { tenant_id, chat_type, household_id, service_id, title, participant_user_ids }
  const { participant_user_ids, ...chatData } = payload;
  const { data: chat, error: chatError } = await supabase
    .from('chats')
    .insert([chatData])
    .select()
    .single();
  if (chatError) throw chatError;

  // Insert participants (creator + everyone else)
  const participants = participant_user_ids.map(user_id => ({
    chat_id: chat.id,
    user_id,
    role: null
  }));
  const { error: partError } = await supabase.from('chat_participants').insert(participants);
  if (partError) throw partError;

  return chat;
}

export async function getChatsForUser(supabase, user_id, tenant_id) {
  // Returns all chats for this user (not archived), optionally filtered by tenant
  const { data, error } = await supabase
    .from('chats')
    .select('*, chat_participants!inner(*)')
    .eq('is_archived', false)
    .eq('tenant_id', tenant_id)
    .in('id',
      supabase
        .from('chat_participants')
        .select('chat_id')
        .eq('user_id', user_id)
    );
  if (error) throw error;
  return data;
}

export async function getChatById(supabase, chat_id) {
  const { data, error } = await supabase
    .from('chats')
    .select('*, chat_participants(*), chat_messages(*)')
    .eq('id', chat_id)
    .single();
  if (error) throw error;
  return data;
}

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

export async function sendMessage(supabase, payload) {
  // payload: { chat_id, sender_id, body, message_type, memory_id, attachment_url }
  const { data, error } = await supabase
    .from('chat_messages')
    .insert([payload])
    .select()
    .single();
  if (error) throw error;
  // Optionally: Update last_message_at on chat
  await supabase
    .from('chats')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', payload.chat_id);
  return data;
}

export async function listMessages(supabase, chat_id, { limit = 50, before } = {}) {
  let query = supabase
    .from('chat_messages')
    .select('*')
    .eq('chat_id', chat_id)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (before) query = query.lt('created_at', before);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function editMessage(supabase, message_id, new_body) {
  const { data, error } = await supabase
    .from('chat_messages')
    .update({ body: new_body, edited_at: new Date().toISOString() })
    .eq('id', message_id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteMessage(supabase, message_id, user_id, asAdmin = false) {
  // Soft delete (set deleted_at); Only allow if user is sender or asAdmin
  const { data: msg, error: fetchErr } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('id', message_id)
    .single();
  if (fetchErr) throw fetchErr;
  if (!asAdmin && msg.sender_id !== user_id) {
    throw new Error('Unauthorized');
  }
  const { data, error } = await supabase
    .from('chat_messages')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', message_id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Reactions are stored as a JSONB array or as a separate table.
// For simplicity, here's an array mutator for reactions stored inline:
export async function addReaction(supabase, message_id, user_id, emoji) {
  // Fetch, append, and update
  const { data: msg, error: fetchErr } = await supabase
    .from('chat_messages')
    .select('reactions')
    .eq('id', message_id)
    .single();
  if (fetchErr) throw fetchErr;
  const reactions = Array.isArray(msg.reactions) ? msg.reactions : [];
  if (reactions.find(r => r.user_id === user_id && r.emoji === emoji)) return msg; // Prevent duplicate
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
  // Remove user's reaction
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

export async function markRead(supabase, message_id, user_id) {
  // Insert or update read receipt
  const { data, error } = await supabase
    .from('chat_message_reads')
    .upsert({
      message_id,
      user_id,
      read_at: new Date().toISOString()
    }, { onConflict: ['message_id', 'user_id'] });
  if (error) throw error;
  return data;
}

// You can add more utility functions as needed (e.g., for admin queries, stats, etc.)
