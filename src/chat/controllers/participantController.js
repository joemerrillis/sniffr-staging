// src/chat/controllers/participantController.js

import { addParticipant, removeParticipant } from '../services/participantService.js';
import { getSupabase, getUserId, getTenantId } from '../utils/chatUtils.js';


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
