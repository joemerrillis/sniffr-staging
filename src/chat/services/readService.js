// src/chat/services/readService.js

import { nowIso } from '../utils/chatUtils.js';

export async function markRead(supabase, message_id, user_id) {
  const { data, error } = await supabase
    .from('chat_message_reads')
    .upsert({
      message_id,
      user_id,
      read_at: nowIso()
    }, { onConflict: ['message_id', 'user_id'] });
  if (error) throw error;
  return data;
}
