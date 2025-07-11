import { appendTranscriptEventsService } from '../service/appendTranscriptEvents.js';

// Controller for POST /walk-reports/:id/transcript
export async function appendTranscriptEventsController(req, reply) {
  try {
    const { id: walkReportId } = req.params;
    const { transcript, dog_id } = req.body || {};

    req.log.info('[TranscriptController] Incoming params:', req.params);
    req.log.info('[TranscriptController] Incoming body:', req.body);

    if (!walkReportId || typeof walkReportId !== "string") {
      req.log.error('[TranscriptController] walkReportId missing');
      return reply.code(400).send({ success: false, error: "walkReportId is required in URL" });
    }
    if (!transcript || typeof transcript !== "string" || !transcript.trim()) {
      req.log.error('[TranscriptController] transcript missing or empty');
      return reply.code(400).send({ success: false, error: "transcript (string) is required in body" });
    }
    if (!dog_id || typeof dog_id !== "string") {
      req.log.error('[TranscriptController] dog_id missing');
      return reply.code(400).send({ success: false, error: "dog_id (uuid) is required in body" });
    }

    const supabase = req.server.supabase || req.supabase;

    const result = await appendTranscriptEventsService({
      supabase,
      walkReportId,
      transcriptText: transcript,
      dogId: dog_id,
    });

    // ENSURE: events/tags arrays are returned and correct
    let tags = Array.isArray(result.tags) ? result.tags.filter(t => t && typeof t === 'object' && t.name) : [];
    let events = Array.isArray(result.events) ? result.events.filter(ev => ev && typeof ev === 'object' && ev.report_id) : [];

    req.log.info(`[TranscriptController] tags count: ${tags.length}`);
    req.log.info(`[TranscriptController] tags sample: ${JSON.stringify(tags[0], null, 2)}`);
    req.log.info(`[TranscriptController] events count: ${events.length}`);
    req.log.info(`[TranscriptController] events sample: ${JSON.stringify(events[0], null, 2)}`);

    if (!events.length) {
      req.log.error('[TranscriptController] No valid events returned!', { events: result.events });
      return reply.code(500).send({ success: false, error: "No valid events returned from service" });
    }

    return reply.send({
      success: true,
      report_id: walkReportId,
      transcript: result.transcript,
      events,
      tags
    });
  } catch (error) {
    req.log.error({ err: error }, "[appendTranscriptEventsController] Failed to process transcript");
    return reply.code(500).send({
      success: false,
      error: error.message || "Failed to process transcript"
    });
  }
}
