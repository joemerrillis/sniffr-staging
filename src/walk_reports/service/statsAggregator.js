// NO import of supabase here!

// Example: aggregate stats for a walk and dog from dog_events
export async function aggregateStats(supabase, walk_id, dog_id) {
  const { data: events, error } = await supabase
    .from('dog_events')
    .select('*')
    .eq('report_id', walk_id)
    .eq('dog_id', dog_id);

  if (error) throw new Error(error.message);

  // Example: count occurrences of each tag
  const tagCounts = {};
  (events || []).forEach(event => {
    (event.tags || []).forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });
  return tagCounts;
}
