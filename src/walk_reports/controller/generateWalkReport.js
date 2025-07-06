// src/walk_reports/controller/generateWalkReportController.js

import { generateWalkReport } from '../service/generateWalkReport.js';

export async function generateWalkReportController(request, reply) {
  const supabase = request.server.supabase;
  const reportId = request.params.id;

  try {
    const updatedReport = await generateWalkReport(supabase, reportId);
    return reply.send({ report: updatedReport });
  } catch (e) {
    console.error("Error generating walk report:", e);
    return reply.code(500).send({ error: "Error generating walk report", details: e.message });
  }
}
