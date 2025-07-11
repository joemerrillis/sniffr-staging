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

    const supabase = req.server.supabase || req.supabase; // adapt to your app

    const result = await appendTranscriptEventsService({
      supabase,
      walkReportId,
      transcriptText: transcript,
      dogId: dog_id,
    });

    req.log.info('[TranscriptController] Service result:', !!result);
    req.log.info('[TranscriptController] tags count:', Array.isArray(result.tags) ? result.tags.length : 'not array');
    req.log.info('[TranscriptController] tags sample:', JSON.stringify(result.tags?.[0], null, 2));
    req.log.info('[TranscriptController] events count:', Array.isArray(result.events) ? result.events.length : 'not array');
    req.log.info('[TranscriptController] events sample:', JSON.stringify(result.events?.[0], null, 2));
    req.log.info('[TranscriptController] transcript typeof:', typeof result.transcript);

    // Defensive: ensure only valid event objects (with report_id)
    let events = Array.isArray(result.events)
      ? result.events.filter(ev => ev && typeof ev === 'object' && ev.report_id)
      : [];
    if (!Array.isArray(events) || events.length === 0) {
      req.log.error('[TranscriptController] No valid events returned!', { events: result.events });
      return reply.code(500).send({ success: false, error: "No valid events returned from service" });
    }

    // Tags should always be an array of objects with at least .name
    let tags = Array.isArray(result.tags)
      ? result.tags.filter(t => t && typeof t === 'object' && t.name)
      : [];
    if (!Array.isArray(tags) || tags.length === 0) {
      req.log.error('[TranscriptController] No valid tags returned!', { tags: result.tags });
      // not fatal, but log it
    }

    return reply.send({
      success: true,
      walk_report_id: walkReportId,
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
