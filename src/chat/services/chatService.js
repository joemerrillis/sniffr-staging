// src/chat/services/chatService.js

import { addParticipant } from './participantService.js';

/**
 * Create a new chat with participants.
 * (Generic use – unchanged)
 */
export async function createChat(supabase, payload) {
  const { participant_user_ids, ...chatData } = payload;
  const { data: chat, error: chatError } = await supabase
    .from('chats')
    .insert([chatData])
    .select()
    .single();
  if (chatError) throw chatError;

  for (const user_id of participant_user_ids) {
    await addParticipant(supabase, chat.id, user_id);
  }
  return chat;
}

/**
 * Get all chats for a user.
 */
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

/**
 * Get a chat by ID.
 */
export async function getChatById(supabase, chat_id) {
  const { data, error } = await supabase
    .from('chats')
    .select('*, chat_participants(*), chat_messages(*)')
    .eq('id', chat_id)
    .single();
  if (error) throw error;
  return data;
}

/**
 * Create a dedicated chat thread for a boarding.
 * Adds all household members (active) and staff as participants.
 * Uses addParticipant for modularity.
 */
export async function createBoardingChatThread(supabase, {
  tenant_id,
  household_id,
  boarding_id,
  staff_ids = [],
  title = null,
}) {
  // Create chat record
  const { data: chat, error: chatError } = await supabase
    .from('chats')
    .insert([{
      tenant_id,
      chat_type: 'boarding',
      household_id,
      service_id: boarding_id,
      title,
      is_archived: false,
    }])
    .select()
    .single();
  if (chatError) throw chatError;

  // Get all active household members
  const { data: members, error: hmErr } = await supabase
    .from('household_members')
    .select('user_id')
    .eq('household_id', household_id)
    .eq('status', 'active');
  if (hmErr) throw hmErr;

  // Add household participants
  for (const m of members || []) {
    await addParticipant(supabase, chat.id, m.user_id, 'household');
  }
  // Add staff participants
  for (const user_id of staff_ids || []) {
    await addParticipant(supabase, chat.id, user_id, 'staff');
  }

  return chat;
}

/**
 * Post a status or photo update as a chat message.
 */
export async function postChatMessage(supabase, {
  chat_id,
  sender_id,
  body,
  message_type = 'status_update',
  memory_id = null,
  attachment_url = null,
  dog_ids = [],
}) {
  const { data: message, error } = await supabase
    .from('chat_messages')
    .insert([{
      chat_id,
      sender_id,
      body,
      message_type,
      memory_id,
      attachment_url,
      dog_ids,
    }])
    .select()
    .single();

  if (error) throw error;
  return message;
}
