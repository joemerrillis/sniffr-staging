// src/chat/controllers/readController.js

import { markRead } from '../services/chatService.js';
import { getSupabase, getUserId } from '../../utils/chatUtils.js';

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
