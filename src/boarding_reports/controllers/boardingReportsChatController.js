// src/boarding_reports/controllers/boardingReportsChatController.js

import { createBoardingChatThread } from '../../chat/services/chatService.js';

export async function createChatForBoardingReport(req, reply) {
  const supabase = req.server.supabase;
  const boarding_report_id = req.params.id;

  // Lookup boarding_report to get boarding_id, staff_ids, etc.
  const { data: report, error: reportErr } = await supabase
    .from('boarding_reports')
    .select('id, boarding_id, staff_ids')
    .eq('id', boarding_report_id)
    .single();

  if (reportErr || !report) {
    console.error('Boarding report not found:', reportErr, report);
    return reply.code(404).send({ error: 'Boarding report not found.' });
  }

  // Lookup boardings for tenant_id, user_id, etc.
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
  let household_id = null;

  // 1. Check households table first (primary_contact_id)
  const { data: household, error: householdErr } = await supabase
    .from('households')
    .select('id')
    .eq('primary_contact_id', user_id)
    .single();

  console.log('Checked households table for user', user_id, 'Result:', household);

  if (household && household.id) {
    household_id = household.id;
  } else {
    // 2. Fallback: check household_members table for any membership
    const { data: household_member, error: memberErr } = await supabase
      .from('household_members')
      .select('household_id')
      .eq('user_id', user_id)
      .single();

    console.log('Checked household_members for user', user_id, 'Result:', household_member);

    if (household_member && household_member.household_id) {
      household_id = household_member.household_id;
    }
  }

  if (!household_id) {
    console.error('No household found for user:', user_id);
    reply.code(400).send({ error: 'Could not determine household for boarding user.' });
    return;
  }

  // (Optional) Log all household members (if you want to see who will be included)
  const { data: all_members, error: allMembersErr } = await supabase
    .from('household_members')
    .select('user_id')
    .eq('household_id', household_id);

  console.log('All household members for household', household_id, ':', all_members);

  // Create the chat thread using the resolved household_id
  const chat = await createBoardingChatThread(supabase, {
    tenant_id: boarding.tenant_id,
    household_id, // Always the correct ID now
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
