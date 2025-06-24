// src/chat/services/chatService.js

// Create a new chat with participants
export async function createChat(supabase, payload) {
  const { participant_user_ids, ...chatData } = payload;
  const { data: chat, error: chatError } = await supabase
    .from('chats')
    .insert([chatData])
    .select()
    .single();
  if (chatError) throw chatError;

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
