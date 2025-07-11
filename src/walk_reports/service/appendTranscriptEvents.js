import fetch from 'node-fetch';

export async function appendTranscriptEventsService({
  supabase,
  walkReportId,
  transcriptText, // string: the raw transcript
  dogId           // uuid, FK to dogs table, for this walk report
}) {
  // 1. Call the worker to get events and tags
  const workerUrl = process.env.CF_TRANSCRIPT_EVENT_WORKER_URL;
  if (!workerUrl) throw new Error('CF_TRANSCRIPT_EVENT_WORKER_URL is not set in environment!');
  const workerRes = await fetch(workerUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ transcript: transcriptText })
  });
  if (!workerRes.ok) {
    const errText = await workerRes.text();
    console.error('[appendTranscriptEventsService] Worker error:', errText);
    throw new Error(`Worker error: ${errText}`);
  }
  const { output: eventsArray } = await workerRes.json(); // should be [{text, tags: [objects]}, ...]

  console.log('[appendTranscriptEventsService] eventsArray:', JSON.stringify(eventsArray, null, 2));

  // 2. Extract all tags (objects) from all events, deduplicate by name
  const allTags = eventsArray.flatMap(e => Array.isArray(e.tags) ? e.tags : []);
  const uniqueTagsMap = new Map();
  for (const tag of allTags) {
    if (tag && tag.name && !uniqueTagsMap.has(tag.name)) {
      uniqueTagsMap.set(tag.name, tag);
    }
  }
  const uniqueTags = Array.from(uniqueTagsMap.values());
  console.log('[appendTranscriptEventsService] uniqueTags:', JSON.stringify(uniqueTags, null, 2));

  // 3. Get current timestamp
  const processedAt = new Date().toISOString();

  // 4. Build transcript JSONB object for walk_reports
  const transcriptObj = {
    raw: transcriptText,
    events: eventsArray,
    tags: uniqueTags,
    status: "complete",
    processed_at: processedAt
  };

  // 5. Update the walk_reports.transcript column
  const { error: updateError } = await supabase
    .from('walk_reports')
    .update({ transcript: transcriptObj })
    .eq('id', walkReportId);
  if (updateError) {
    console.error('[appendTranscriptEventsService] walk_reports update error:', updateError);
    throw updateError;
  }

  // 6. Insert events into dog_events table
  // Each event: assign report_id, dog_id, tags (as objects), source, event_type, note
  const eventsToInsert = eventsArray.map(event => ({
    report_id: walkReportId,
    dog_id: dogId,
    tags: event.tags, // array of tag objects (jsonb)
    source: 'transcript',
    event_type: 'walk_report',
    note: event.text,
    created_at: processedAt
  }));

  let insertedEvents = [];
  if (eventsToInsert.length > 0) {
    const { data, error: eventsError } = await supabase
      .from('dog_events')
      .insert(eventsToInsert)
      .select('report_id, dog_id, tags, source, event_type, note, created_at');
    if (eventsError) {
      console.error('[appendTranscriptEventsService] dog_events insert error:', eventsError);
      throw eventsError;
    }
    insertedEvents = data || [];
    console.log('[appendTranscriptEventsService] Inserted events:', JSON.stringify(insertedEvents, null, 2));
  } else {
    console.warn('[appendTranscriptEventsService] No events to insert!');
  }

  // 7. Insert unique tags into event_tags if not already present
  if (uniqueTags.length > 0) {
    // Query for existing tags by name
    const { data: existingTagsData, error: tagQueryError } = await supabase
      .from('event_tags')
      .select('tag')
      .in('tag', uniqueTags.map(t => t.name));
    if (tagQueryError) {
      console.error('[appendTranscriptEventsService] event_tags select error:', tagQueryError);
      throw tagQueryError;
    }

    const existingTags = (existingTagsData || []).map(row => row.tag);
    const newTags = uniqueTags.filter(t => !existingTags.includes(t.name));
    if (newTags.length > 0) {
      // Insert new tags using tag fields
      const newTagsRows = newTags.map(t => ({
        tag: t.name,
        display_name: t.name.charAt(0).toUpperCase() + t.name.slice(1),
        description: t.description || "",
        emoji: t.emoji || "",
        active: true
      }));
      const { error: insertTagsError } = await supabase
        .from('event_tags')
        .insert(newTagsRows);
      if (insertTagsError) {
        console.error('[appendTranscriptEventsService] event_tags insert error:', insertTagsError);
        throw insertTagsError;
      }
      console.log('[appendTranscriptEventsService] Inserted new event_tags:', JSON.stringify(newTagsRows, null, 2));
    }
  }

  // 8. Return everything for logging or controller response
  return {
    transcript: transcriptObj,
    events: insertedEvents, // Actual rows from the DB!
    tags: uniqueTags
  };
}
