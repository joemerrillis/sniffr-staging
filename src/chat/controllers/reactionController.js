// src/chat/controllers/reactionController.js

import { addReaction, removeReaction } from '../services/chatService.js';
import { getSupabase, getUserId, getTenantId } from '../utils/chatUtils.js';


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
