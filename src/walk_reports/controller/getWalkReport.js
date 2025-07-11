import { getWalkReportService } from '../service/getWalkReport.js';

// Controller for GET /walk-reports/:id
export async function getWalkReportController(req, reply) {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      return reply.code(400).send({ error: "Walk report ID is required in URL" });
    }
    const supabase = req.server.supabase || req.supabase;

    req.log.info("[getWalkReportController] Fetching walk report:", id);

    // Fetch and build canonical response
    const result = await getWalkReportService({ supabase, walkReportId: id });

    req.log.info("[getWalkReportController] Fetched events:", result.events.length);
    req.log.info("[getWalkReportController] Fetched tags:", result.tags.length);

    // This matches your schema: { report: { ... } }
    return reply.send({
      report: {
        ...result.report,          // original report row, including transcript JSONB if you want
        events: result.events,     // always from dog_events table
        tags: result.tags,         // always from event_tags table
      }
    });
  } catch (error) {
    req.log.error({ err: error }, "[getWalkReportController] Failed to get walk report");
    return reply.code(500).send({
      error: error.message || "Failed to fetch walk report"
    });
  }
}
