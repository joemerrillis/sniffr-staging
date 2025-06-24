import {
  listMembers,
  addMember,
  removeMember
} from '../services/householdMemberService.js';

import { getSupabase } from '../../chat/utils/chatUtils.js';

export async function listMembersHandler(request, reply) {
  try {
    const supabase = getSupabase(request);
    const { id } = request.params;
    const members = await listMembers(supabase, id);
    return reply.send({ data: members });
  } catch (err) {
    return reply.code(400).send({ error: err.message });
  }
}

export async function addMemberHandler(request, reply) {
  try {
    const supabase = getSupabase(request);
    const { id } = request.params; // household_id
    const { user_id, role } = request.body;
    const member = await addMember(supabase, id, user_id, role);
    return reply.code(201).send({ data: member });
  } catch (err) {
    return reply.code(400).send({ error: err.message });
  }
}

export async function removeMemberHandler(request, reply) {
  try {
    const supabase = getSupabase(request);
    const { id, user_id } = request.params;
    const result = await removeMember(supabase, id, user_id);
    return reply.send({ data: result });
  } catch (err) {
    return reply.code(400).send({ error: err.message });
  }
}
