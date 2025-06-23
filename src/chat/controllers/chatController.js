// src/chat/controllers/chatController.js

import {
  createChat,
  getChatsForUser,
  getChatById,
  addParticipant,
  removeParticipant,
  sendMessage,
  listMessages,
  editMessage,
  deleteMessage,
  addReaction,
  removeReaction,
  markRead
} from '../services/chatService.js';

// Helper: get supabase and current user from request (adapt as needed)
function getSupabase(request) {
  return request.server.supabase || request.supabase || request.app.supabase;
}
function getUserId(request) {
  // Adjust per your auth system
  return request.user?.id || request.auth?.userId || request.headers['x-user-id'];
}
function getTenantId(request) {
  return request.user?.tenant_id || request.headers['x-tenant-id'];
}

// List all chats for user
export async function listChats(request, reply) {
  try {
    const supabase = getSupabase(request);
    const user_id = getUserId(request);
    const tenant_id = getTenantId(request);
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

// Add participant
export async function addParticipantHandler(request, reply) {
  try {
    const supabase = getSupabase(request);
    const { id } = request.params; // chat_id
    const { user_id, role } = request.body;
    const participant = await addParticipant(supabase, id, user_id, role);
    return reply.code(201).send({ data: participant });
  } catch (err) {
    return reply.code(400).send({ error: err.message });
  }
}

// Remove participant
export async function removeParticipantHandler(request, reply) {
  try {
    const supabase = getSupabase(request);
    const { id, user_id } = request.params;
    const result = await removeParticipant(supabase, id, user_id);
    return reply.send({ data: result });
  } catch (err) {
    return reply.code(400).send({ error: err.message });
  }
}

// List messages in a chat (paginated)
export async function listMessagesHandler(request, reply) {
  try {
    const supabase = getSupabase(request);
    const { id } = request.params; // chat_id
    const { limit, before } = request.query;
    const messages = await listMessages(supabase, id, { limit, before });
    return reply.send({ data: messages });
  } catch (err) {
    return reply.code(500).send({ error: err.message });
  }
}

// Send message to a chat
export async function sendMessageHandler(request, reply) {
  try {
    const supabase = getSupabase(request);
    const payload = request.body;
    const message = await sendMessage(supabase, payload);
    return reply.code(201).send({ data: message });
  } catch (err) {
    return reply.code(400).send({ error: err.message });
  }
}

// Edit message
export async function editMessageHandler(request, reply) {
  try {
    const supabase = getSupabase(request);
    const { id } = request.params; // message_id
    const { new_body } = request.body;
    const message = await editMessage(supabase, id, new_body);
    return reply.send({ data: message });
  } catch (err) {
    return reply.code(400).send({ error: err.message });
  }
}

// Delete message (soft delete)
export async function deleteMessageHandler(request, reply) {
  try {
    const supabase = getSupabase(request);
    const { id } = request.params; // message_id
    const user_id = getUserId(request);
    const message = await deleteMessage(supabase, id, user_id, false);
    return reply.send({ data: message });
  } catch (err) {
    return reply.code(403).send({ error: err.message });
  }
}

// Add reaction to a message
export async function addReactionHandler(request, reply) {
  try {
    const supabase = getSupabase(request);
    const { id } = request.params; // message_id
    const { user_id, emoji } = request.body;
    const message = await addReaction(supabase, id, user_id, emoji);
    return reply.send({ data: message });
  } catch (err) {
    return reply.code(400).send({ error: err.message });
  }
}

// Remove reaction from a message
export async function removeReactionHandler(request, reply) {
  try {
    const supabase = getSupabase(request);
    const { id } = request.params; // message_id
    const { user_id, emoji } = request.body;
    const message = await removeReaction(supabase, id, user_id, emoji);
    return reply.send({ data: message });
  } catch (err) {
    return reply.code(400).send({ error: err.message });
  }
}

// Mark message as read
export async function markReadHandler(request, reply) {
  try {
    const supabase = getSupabase(request);
    const { id } = request.params; // message_id
    const user_id = getUserId(request);
    const result = await markRead(supabase, id, user_id);
    return reply.send({ data: result });
  } catch (err) {
    return reply.code(400).send({ error: err.message });
  }
}
