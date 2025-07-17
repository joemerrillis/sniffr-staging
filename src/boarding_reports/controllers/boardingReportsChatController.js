// src/boarding_reports/controllers/boardingReportsChatController.js

import { createBoardingChatThread } from '../../chat/services/chatService.js';

export async function createChatForBoardingReport(req, reply) {
  const supabase = req.server.supabase;
  const boarding_report_id = req.params.id; // <-- Use route param!

  // Lookup boarding_report to get boarding_id, staff_ids, etc.
  const { data: report, error: reportErr } = await supabase
    .from('boarding_reports')
    .select('id, boarding_id, staff_ids')
    .eq('id', boarding_report_id)
    .single();
  if (reportErr || !report) {
    return reply.code(404).send({ error: 'Boarding report not found.' });
  }

  // Lookup boardings for tenant_id, user_id, etc.
  const { data: boarding, error: bErr } = await supabase
    .from('boardings')
    .select('id, tenant_id, user_id')
    .eq('id', report.boarding_id)
    .single();
  if (bErr || !boarding) {
    return reply.code(404).send({ error: 'Boarding not found.' });
  }

  // Lookup household_id for the user
// 1. Try household_members first
let { data: household_member } = await supabase
  .from('household_members')
  .select('household_id')
  .eq('user_id', boarding.user_id)
  .single();

let household_id = household_member?.household_id;

if (!household_id) {
  // 2. Fallback: look up households where user is the primary contact
  const { data: household, error: hErr } = await supabase
    .from('households')
    .select('id')
    .eq('primary_contact_id', boarding.user_id)
    .single();

  household_id = household?.id;
}

if (!household_id) {
  reply.code(400).send({ error: 'Could not determine household for boarding user.' });
  return;
}


  // Create the chat thread
  const chat = await createBoardingChatThread(supabase, {
    tenant_id: boarding.tenant_id,
    household_id: household_member.household_id,
    boarding_id: boarding.id,
    staff_ids: report.staff_ids || [],
    title: 'Boarding Updates',
  });

  // Optionally: Update boarding_report with new chat_id
  await supabase
    .from('boarding_reports')
    .update({ chat_id: chat.id })
    .eq('id', report.id);

  reply.send({ chat });
}
