// src/walk_reports/service/getWalkReport.js

/**
 * Canonical fetch for a walk report and all associated events/tags
 * @param {object} params
 *   - supabase: Supabase client
 *   - walkReportId: string (UUID)
 */
export async function getWalkReportService({ supabase, walkReportId }) {
  // 1. Fetch the walk_report itself
  const { data: report, error: reportError } = await supabase
    .from('walk_reports')
    .select('*')
    .eq('id', walkReportId)
    .single();
  if (reportError || !report) throw reportError || new Error("Walk report not found");

  // 2. Get all dog_events with this report_id
  const { data: events, error: eventsError } = await supabase
    .from('dog_events')
    .select('*')
    .eq('report_id', walkReportId);
  if (eventsError) throw eventsError;

  // 3. Find all unique tag names referenced in any event
  const tagNames = [...new Set(
    (events || []).flatMap(ev =>
      Array.isArray(ev.tags)
        ? ev.tags.map(t => (typeof t === 'object' && t.name ? t.name : t))
        : []
    )
  )];

  // 4. Query event_tags for these names
  let tags = [];
  if (tagNames.length > 0) {
    const { data: tagRows, error: tagsError } = await supabase
      .from('event_tags')
      .select('*')
      .in('tag', tagNames);
    if (tagsError) throw tagsError;
    tags = tagRows || [];
  }

  // 5. Return canonical structure
  return {
    report,
    events: events || [],
    tags
  };
}
