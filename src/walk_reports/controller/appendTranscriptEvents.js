import { appendTranscriptEventsService } from '../service/appendTranscriptEvents.js';

// Controller for POST /walk-reports/:id/transcript
export async function appendTranscriptEventsController(req, reply) {
  try {
    const { id: walkReportId } = req.params;
    // Accept either JSON or form-encoded bodies
    const { transcript, dog_id } = req.body || {};

    if (!walkReportId || typeof walkReportId !== "string") {
      return reply.code(400).send({ success: false, error: "walkReportId is required in URL" });
    }
    if (!transcript || typeof transcript !== "string" || !transcript.trim()) {
      return reply.code(400).send({ success: false, error: "transcript (string) is required in body" });
    }
    if (!dog_id || typeof dog_id !== "string") {
      return reply.code(400).send({ success: false, error: "dog_id (uuid) is required in body" });
    }

    // Access your Supabase client
    const supabase = req.server.supabase || req.supabase; // adapt to your app

    // Call the service
    const result = await appendTranscriptEventsService({
      supabase,
      walkReportId,
      transcriptText: transcript,
      dogId: dog_id,
    });

    return reply.send({
      success: true,
      walk_report_id: walkReportId,
      transcript: result.transcript,
      events: result.events,
      tags: result.tags
    });
  } catch (error) {
    req.log.error({ err: error }, "[appendTranscriptEventsController] Failed to process transcript");
    return reply.code(500).send({
      success: false,
      error: error.message || "Failed to process transcript"
    });
  }
}
