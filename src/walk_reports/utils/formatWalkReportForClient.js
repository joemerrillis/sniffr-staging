// Join in media, events, and format for easy display in UI
export function formatWalkReportForClient(report) {
  // This is a stub. In reality, you'd shape data for your frontend.
  return {
    ...report,
    eventCount: (report.dog_events || []).length,
    mediaCount: (report.dog_memories || []).length,
    highlights: (report.ai_story_json || []).slice(0, 3)
  };
}
