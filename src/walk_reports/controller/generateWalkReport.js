// src/walk_reports/controller/generateWalkReportController.js

import walkReportsService from '../services/walkReportsService.js';

export async function generateWalkReportController(request, reply) {
  const supabase = request.server.supabase;
  const reportId = request.params.id;

  try {
    const updatedReport = await walkReportsService.generateReport(supabase, reportId);
    return reply.send({ report: updatedReport });
  } catch (e) {
    console.error("Error generating walk report:", e);
    return reply.code(500).send({ error: "Error generating walk report", details: e.message });
  }
}
