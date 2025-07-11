// src/walk_reports/controller/appendTranscriptEvents.js

import { appendTranscriptEventsService } from '../service/appendTranscriptEvents.js';

// Controller for POST /walk-reports/:id/transcript
export async function appendTranscriptEventsController(req, reply) {
  try {
    // Log request params and body for debugging
    req.log.info('[TranscriptController] Incoming params:', req.params);
    req.log.info('[TranscriptController] Incoming body:', req.body);

    const { id: walkReportId } = req.params;
    const { transcript, dog_id } = req.body || {};

    if (!walkReportId || typeof walkReportId !== "string") {
      req.log.error('[TranscriptController] walkReportId missing or invalid:', walkReportId);
      return reply.code(400).send({ success: false, error: "walkReportId is required in URL" });
    }
    if (!transcript || typeof transcript !== "string" || !transcript.trim()) {
      req.log.error('[TranscriptController] transcript missing or invalid:', transcript);
      return reply.code(400).send({ success: false, error: "transcript (string) is required in body" });
    }
    if (!dog_id || typeof dog_id !== "string") {
      req.log.error('[TranscriptController] dog_id missing or invalid:', dog_id);
      return reply.code(400).send({ success: false, error: "dog_id (uuid) is required in body" });
    }

    // Access your Supabase client
    const supabase = req.server.supabase || req.supabase; // adapt to your app

    // Call the service and log the full result for traceability
    const result = await appendTranscriptEventsService({
      supabase,
      walkReportId,
      transcriptText: transcript,
      dogId: dog_id,
    });
    req.log.info('[TranscriptController] Service result:', JSON.stringify(result, null, 2));

    // Defensive: log array lengths and example objects for events/tags
    req.log.info(`[TranscriptController] tags count: ${result.tags?.length || 0}`);
    if (result.tags?.length) req.log.info('[TranscriptController] tags sample:', result.tags[0]);
    req.log.info(`[TranscriptController] events count: ${result.events?.length || 0}`);
    if (result.events?.length) req.log.info('[TranscriptController] events sample:', result.events[0]);

    // Validate all events/tags are objects and have report_id (events)
    let tags = Array.isArray(result.tags)
      ? result.tags.map(tag => (typeof tag === 'object' ? tag : (() => { req.log.warn('Tag not object:', tag); return {}; })()))
      : [];
    let events = Array.isArray(result.events)
      ? result.events.map(ev => {
          if (typeof ev !== 'object') {
            req.log.warn('Event not object:', ev);
            return {};
          }
          if (!ev.report_id) {
            req.log.error('Event missing report_id:', ev);
          }
          return ev;
        })
      : [];

    // Final send; this response shape matches your OpenAPI spec
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
