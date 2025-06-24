export async function addReaction(supabase, message_id, user_id, emoji) {
  // Fetch, append, and update
  const { data: msg, error: fetchErr } = await supabase
    .from('chat_messages')
    .select('*') // Get full message for embedding context!
    .eq('id', message_id)
    .single();
  if (fetchErr) throw fetchErr;
  const reactions = Array.isArray(msg.reactions) ? msg.reactions : [];
  if (reactions.find(r => r.user_id === user_id && r.emoji === emoji)) return msg;
  reactions.push({ user_id, emoji });
  const { data, error } = await supabase
    .from('chat_messages')
    .update({ reactions })
    .eq('id', message_id)
    .select()
    .single();
  if (error) throw error;

  // --- Begin: Embed on Reaction (fire and forget) ---
  // Only embed if the message has not already been embedded
  // (If you have an embedding_id column or similar, check for it here. Otherwise, embed always.)
  try {
    if (msg.body && msg.body.trim()) {
      fetch('https://YOUR-CHAT-EMBED-WORKER-URL', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message_id: msg.id,
          body: msg.body,
          meta: {
            chat_id: msg.chat_id,
            sender_id: msg.sender_id,
            // Include any other metadata you want for RAG:
            dog_id: msg.dog_id || null,
            household_id: msg.household_id || null
            // ...more as needed
          }
        })
      }).catch(err => console.error('[Chat Embed Worker]', err));
    }
  } catch (err) {
    // Log but never block addReaction on embedding errors
    console.error('[Chat Embed Worker]', err);
  }
  // --- End: Embed on Reaction ---

  return data;
}

export async function removeReaction(supabase, message_id, user_id, emoji) {
  const { data: msg, error: fetchErr } = await supabase
    .from('chat_messages')
    .select('reactions')
    .eq('id', message_id)
    .single();
  if (fetchErr) throw fetchErr;
  let reactions = Array.isArray(msg.reactions) ? msg.reactions : [];
  reactions = reactions.filter(r => !(r.user_id === user_id && r.emoji === emoji));
  const { data, error } = await supabase
    .from('chat_messages')
    .update({ reactions })
    .eq('id', message_id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
