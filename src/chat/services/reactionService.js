// src/chat/services/reactionService.js

export async function addReaction(supabase, message_id, user_id, emoji) {
  console.log(`[addReaction] Called for message_id: ${message_id}, user_id: ${user_id}, emoji: ${emoji}`);

  // Fetch, append, and update
  const { data: msg, error: fetchErr } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('id', message_id)
    .single();
  if (fetchErr) {
    console.error('[addReaction] Error fetching message:', fetchErr);
    throw fetchErr;
  }
  console.log('[addReaction] Retrieved message:', msg);

  // --- Dynamically look up dog_ids if missing ---
  let dogIds = msg.dog_ids;
  if (!dogIds || !dogIds.length) {
    // Step 1: Get the chat to find service_id
    const { data: chat, error: chatErr } = await supabase
      .from('chats')
      .select('service_id')
      .eq('id', msg.chat_id)
      .single();
    if (!chatErr && chat && chat.service_id) {
      // Step 2: Get dog_ids via service_dog table
      const { data: serviceDogs, error: sdErr } = await supabase
        .from('service_dogs')
        .select('dog_id')
        .eq('service_id', chat.service_id);
      if (!sdErr && serviceDogs && serviceDogs.length) {
        dogIds = serviceDogs.map(d => d.dog_id);
        await supabase
          .from('chat_messages')
          .update({ dog_ids: dogIds })
          .eq('id', message_id);
        msg.dog_ids = dogIds;
        console.log(`[addReaction] Set dog_ids for message ${message_id}:`, dogIds);
      } else {
        dogIds = [];
        console.log(`[addReaction] Could not find dogs for service_id ${chat.service_id}`);
      }
    } else {
      dogIds = [];
      console.log(`[addReaction] Could not find chat or service_id for chat_id ${msg.chat_id}`);
    }
  }

  const reactions = Array.isArray(msg.reactions) ? msg.reactions : [];
  if (reactions.find(r => r.user_id === user_id && r.emoji === emoji)) {
    console.log('[addReaction] Reaction already exists for this user/emoji—skipping update and embedding.');
    return msg;
  }

  reactions.push({ user_id, emoji });
  console.log('[addReaction] Updated reactions array:', reactions);

  const { data: updatedMsg, error: updateErr } = await supabase
    .from('chat_messages')
    .update({ reactions })
    .eq('id', message_id)
    .select()
    .single();
  if (updateErr) {
    console.error('[addReaction] Error updating reactions:', updateErr);
    throw updateErr;
  }
  console.log('[addReaction] Message after updating reactions:', updatedMsg);

  // --- Begin: Fire-and-forget embedding in background ---
  (async () => {
    try {
      if (
        updatedMsg.body &&
        updatedMsg.body.trim() &&
        !updatedMsg.embedding_id
      ) {
        // Always grab the latest dog_ids before embedding!
        const dogIdsForEmbed = updatedMsg.dog_ids && updatedMsg.dog_ids.length ? updatedMsg.dog_ids : dogIds || [];
        const mainDogId = Array.isArray(dogIdsForEmbed) ? dogIdsForEmbed[0] : dogIdsForEmbed;

        const embedPayload = {
          message_id: updatedMsg.id,
          body: updatedMsg.body,
          meta: {
            chat_id: updatedMsg.chat_id,
            sender_id: updatedMsg.sender_id,
            dog_id: mainDogId || null,
            dog_ids: dogIdsForEmbed,
            household_id: updatedMsg.household_id || null
            // ...more as needed
          }
        };
        console.log('[EMBED CALL] Triggering chat embedding with payload:', embedPayload);

        let attempts = 0;
        let embedded = false;
        let embedId = null;

        while (!embedded && attempts < 3) { // Retry up to 3 times
          attempts++;
          try {
            const res = await fetch('https://embed-chat-worker.joemerrillis.workers.dev', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(embedPayload)
            });
            const text = await res.text();
            console.log(`[EMBED CALL] Worker responded (try ${attempts}) status: ${res.status}, body: ${text}`);
            const json = JSON.parse(text);
            if (res.ok && json.ok && json.id) {
              embedId = json.id;
              embedded = true;
              // Update chat_messages with the embedding_id
              const { error: embedErr } = await supabase
                .from('chat_messages')
                .update({ embedding_id: embedId })
                .eq('id', message_id);
              if (embedErr) {
                console.error('[EMBED CALL] Error updating embedding_id:', embedErr);
              } else {
                console.log('[EMBED CALL] embedding_id updated in chat_messages:', embedId);
              }
            } else {
              console.error('[EMBED CALL] Embedding failed:', json);
            }
          } catch (err) {
            console.error('[EMBED CALL] Error during embedding (try/catch):', err);
            // Wait 1 second before retrying
            await new Promise(r => setTimeout(r, 1000));
          }
        }
        if (!embedded) {
          console.error('[EMBED CALL] Embedding failed after 3 attempts, giving up.');
        }
      } else {
        if (!updatedMsg.body || !updatedMsg.body.trim()) {
          console.log('[EMBED CALL] Skipping embedding: message has no body.');
        } else if (updatedMsg.embedding_id) {
          console.log('[EMBED CALL] Skipping embedding: message already embedded. embedding_id:', updatedMsg.embedding_id);
        }
      }
    } catch (err) {
      console.error('[Chat Embed Worker] Exception thrown in embed trigger:', err);
    }
  })();
  // --- End: Fire-and-forget embedding ---

  return updatedMsg;
}

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
