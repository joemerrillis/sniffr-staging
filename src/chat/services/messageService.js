// src/chat/services/messageService.js

import { nowIso } from '../utils/chatUtils.js';

export async function sendMessage(supabase, payload) {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert([payload])
    .select()
    .single();
  if (error) throw error;
  await supabase
    .from('chats')
    .update({ last_message_at: nowIso() })
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
    .update({ body: new_body, edited_at: nowIso() })
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
    .select('sender_id')
    .eq('id', message_id)
    .single();
  if (fetchErr) throw fetchErr;
  if (!asAdmin && msg.sender_id !== user_id) {
    throw new Error('Unauthorized');
  }
  const { data, error } = await supabase
    .from('chat_messages')
    .update({ deleted_at: nowIso() })
    .eq('id', message_id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
