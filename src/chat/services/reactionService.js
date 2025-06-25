export async function addReaction(supabase, message_id, user_id, emoji) {
  console.log(`[addReaction] Called for message_id: ${message_id}, user_id: ${user_id}, emoji: ${emoji}`);

  // Fetch, append, and update
  const { data: msg, error: fetchErr } = await supabase
    .from('chat_messages')
    .select('*') // Get full message including embedding_id!
    .eq('id', message_id)
    .single();
  if (fetchErr) {
    console.error('[addReaction] Error fetching message:', fetchErr);
    throw fetchErr;
  }
  console.log('[addReaction] Retrieved message:', msg);

  const reactions = Array.isArray(msg.reactions) ? msg.reactions : [];
  if (reactions.find(r => r.user_id === user_id && r.emoji === emoji)) {
    console.log('[addReaction] Reaction already exists for this user/emoji—skipping update and embedding.');
    return msg;
  }

  reactions.push({ user_id, emoji });
  console.log('[addReaction] Updated reactions array:', reactions);

  const { data, error } = await supabase
    .from('chat_messages')
    .update({ reactions })
    .eq('id', message_id)
    .select()
    .single();
  if (error) {
    console.error('[addReaction] Error updating reactions:', error);
    throw error;
  }
  console.log('[addReaction] Message after updating reactions:', data);

  // --- Begin: Embed on Reaction (fire and forget) ---
  try {
    if (
      msg.body &&
      msg.body.trim() &&
      !msg.embedding_id
    ) {
      const embedPayload = {
        message_id: msg.id,
        body: msg.body,
        meta: {
          chat_id: msg.chat_id,
          sender_id: msg.sender_id,
          dog_id: msg.dog_id || null,
          household_id: msg.household_id || null
          // ...more as needed
        }
      };
      console.log('[EMBED CALL] Triggering chat embedding with payload:', embedPayload);

      fetch('https://embed-chat-worker.joemerrillis.workers.dev', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(embedPayload)
      })
      .then(res => {
        console.log('[EMBED CALL] Worker responded with status:', res.status);
        return res.text();
      })
      .then(text => {
        console.log('[EMBED CALL] Worker response body:', text);
      })
      .catch(err => console.error('[Chat Embed Worker] ERROR in fetch:', err));
    } else {
      if (!msg.body || !msg.body.trim()) {
        console.log('[EMBED CALL] Skipping embedding: message has no body.');
      } else if (msg.embedding_id) {
        console.log('[EMBED CALL] Skipping embedding: message already embedded. embedding_id:', msg.embedding_id);
      }
    }
  } catch (err) {
    console.error('[Chat Embed Worker] Exception thrown in embed trigger:', err);
  }
  // --- End: Embed on Reaction ---

  return data;
}

// After receiving embedding from worker:
const embeddingId = embedResult.id;

await fetch(`${YOUR_API_BASE}/messages/${message_id}/embedding`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${yourServiceToken}` }, // if needed
  body: JSON.stringify({ embedding_id: embeddingId })
});


export async function removeReaction(supabase, message_id, user_id, emoji) {
  console.log(`[removeReaction] Called for message_id: ${message_id}, user_id: ${user_id}, emoji: ${emoji}`);

  const { data: msg, error: fetchErr } = await supabase
    .from('chat_messages')
    .select('reactions')
    .eq('id', message_id)
    .single();
  if (fetchErr) {
    console.error('[removeReaction] Error fetching message:', fetchErr);
    throw fetchErr;
  }
  let reactions = Array.isArray(msg.reactions) ? msg.reactions : [];
  reactions = reactions.filter(r => !(r.user_id === user_id && r.emoji === emoji));
  console.log('[removeReaction] Updated reactions array:', reactions);

  const { data, error } = await supabase
    .from('chat_messages')
    .update({ reactions })
    .eq('id', message_id)
    .select()
    .single();
  if (error) {
    console.error('[removeReaction] Error updating reactions:', error);
    throw error;
  }
  console.log('[removeReaction] Message after updating reactions:', data);

  return data;
}
