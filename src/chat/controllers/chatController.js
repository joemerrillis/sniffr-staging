// src/chat/controllers/chatController.js

import { createChat, getChatsForUser, getChatById } from '../services/chatService.js';
import { getSupabase, getUserId, getTenantId } from '../utils/chatUtils.js';


// List all chats for user
export async function listChats(request, reply) {
  try {
    const supabase = getSupabase(request);
    const user_id = getUserId(request);
    const tenant_id = getTenantId(request);
    
    if (!user_id) {
      return reply.code(400).send({ error: 'User ID is required' });
    }
    if (!tenant_id) {
      return reply.code(400).send({ error: 'Tenant ID is required' });
    }
    
    const chats = await getChatsForUser(supabase, user_id, tenant_id);
    return reply.send({ data: chats });
  } catch (err) {
    return reply.code(500).send({ error: err.message });
  }
}

// Create a new chat
export async function createChatHandler(request, reply) {
  try {
    const supabase = getSupabase(request);
    const payload = request.body;
    const chat = await createChat(supabase, payload);
    return reply.code(201).send({ data: chat });
  } catch (err) {
    return reply.code(400).send({ error: err.message });
  }
}

// Get chat by ID
export async function retrieveChat(request, reply) {
  try {
    const supabase = getSupabase(request);
    const { id } = request.params;
    const chat = await getChatById(supabase, id);
    return reply.send({ data: chat });
  } catch (err) {
    return reply.code(404).send({ error: 'Chat not found' });
  }
}
