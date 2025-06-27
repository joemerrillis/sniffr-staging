// src/chat/services/reactionService.js

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

  // --- Synchronous: Try embedding if eligible ---
  let embeddingId = null;
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
      }
    };

    console.log('[EMBED CALL] Triggering chat embedding with payload:', embedPayload);

    let success = false, attempts = 0;
    let workerResult = null;
    while (!success && attempts < 3) {
      attempts++;
      try {
        const res = await fetch('https://embed-chat-worker.joemerrillis.workers.dev', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(embedPayload)
        });
        const text = await res.text();
        console.log(`[EMBED CALL] Worker response status: ${res.status}, body:`, text);

        let result = {};
        try { result = JSON.parse(text); } catch (e) {}
        if (res.ok && result && result.ok && result.id) {
          embeddingId = result.id;
          success = true;
        } else {
          console.warn(`[EMBED CALL] Embedding failed attempt ${attempts}:`, result);
        }
      } catch (err) {
        console.error(`[EMBED CALL] Error in fetch attempt ${attempts}:`, err);
      }
      if (!success && attempts < 3) {
        // Wait a bit before retrying (e.g. 2s)
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    if (embeddingId) {
      // Update embedding_id in chat_messages
      try {
        const { error: embErr } = await supabase
          .from('chat_messages')
          .update({ embedding_id: embeddingId })
          .eq('id', msg.id);
        if (embErr) {
          console.error('[addReaction] Error updating embedding_id:', embErr);
        } else {
          console.log('[addReaction] embedding_id updated in chat_messages:', embeddingId);
        }
      } catch (err) {
        console.error('[addReaction] Exception updating embedding_id:', err);
      }
    } else {
      console.error('[addReaction] Embedding failed after 3 attempts; no embedding_id set.');
    }
  } else {
    if (!msg.body || !msg.body.trim()) {
      console.log('[EMBED CALL] Skipping embedding: message has no body.');
    } else if (msg.embedding_id) {
      console.log('[EMBED CALL] Skipping embedding: message already embedded. embedding_id:', msg.embedding_id);
    }
  }

  return data;
}

// ...removeReaction unchanged...
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
