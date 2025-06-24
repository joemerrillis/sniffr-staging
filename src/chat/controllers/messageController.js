// src/chat/controllers/messageController.js

import { sendMessage, listMessages, editMessage, deleteMessage } from '../services/chatService.js';
import { getSupabase, getUserId, getTenantId } from '../utils/chatUtils.js';


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
