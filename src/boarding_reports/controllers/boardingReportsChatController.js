// src/boarding_reports/controllers/boardingReportsChatController.js

import { createBoardingChatThread } from '../../chat/services/chatService.js';

export async function createChatForBoardingReport(req, reply) {
  const supabase = req.server.supabase;
  const boarding_report_id = req.params.id;

  // Lookup boarding_report
  const { data: report, error: reportErr } = await supabase
    .from('boarding_reports')
    .select('id, boarding_id, staff_ids')
    .eq('id', boarding_report_id)
    .single();

  if (reportErr || !report) {
    console.error('Boarding report not found:', reportErr, report);
    return reply.code(404).send({ error: 'Boarding report not found.' });
  }

  // Lookup boarding
  const { data: boarding, error: bErr } = await supabase
    .from('boardings')
    .select('id, tenant_id, user_id')
    .eq('id', report.boarding_id)
    .single();

  if (bErr || !boarding) {
    console.error('Boarding not found:', bErr, boarding);
    return reply.code(404).send({ error: 'Boarding not found.' });
  }

  const user_id = boarding.user_id;

  // 1. Check if the user is primary_contact in any household
  let { data: household, error: householdErr } = await supabase
    .from('households')
    .select('id')
    .eq('primary_contact_id', user_id)
    .single();

  let household_id = household?.id;

  console.log('Checked households table for user', user_id, 'Result:', household);

  // 2. If not found, look in household_members
  if (!household_id) {
    let { data: household_member, error: memberErr } = await supabase
      .from('household_members')
      .select('household_id')
      .eq('user_id', user_id)
      .single();

    console.log('Checked household_members for user', user_id, 'Result:', household_member);

    household_id = household_member?.household_id;
  }

  if (!household_id) {
    console.error('No household found for user:', user_id);
    reply.code(400).send({ error: 'Could not determine household for boarding user.' });
    return;
  }

  // 3. Find all household members (for logging/possible use)
  const { data: all_members, error: allMembersErr } = await supabase
    .from('household_members')
    .select('user_id')
    .eq('household_id', household_id);

  console.log('All household members for household', household_id, ':', all_members);

  // 4. Create the chat thread
  const chat = await createBoardingChatThread(supabase, {
    tenant_id: boarding.tenant_id,
    household_id, // <- always use this
    boarding_id: boarding.id,
    staff_ids: report.staff_ids || [],
    title: 'Boarding Updates',
  });

  // Optionally: Update boarding_report with new chat_id
  await supabase
    .from('boarding_reports')
    .update({ chat_id: chat.id })
    .eq('id', report.id);

  console.log('Created chat thread:', chat);

  reply.send({ chat });
}
