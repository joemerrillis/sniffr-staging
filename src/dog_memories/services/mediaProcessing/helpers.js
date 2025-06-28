// src/dog_memories/services/mediaProcessing/helpers.js

import { createClient } from '@supabase/supabase-js';
import { getDogById } from '../../models/dogModel.js';


const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Get dog names by an array of IDs
export async function getDogNamesFromIds(dogIds) {
  if (!dogIds || !dogIds.length) return [];
  const names = [];
  for (const id of dogIds) {
    try {
      const dog = await getDogById(id);
      if (dog?.name) names.push(dog.name);
    } catch (e) {
      console.error("[getDogNamesFromIds] Error fetching dog name:", e);
    }
  }
  return names.length ? names : ["Unknown"];
}

// Find most recent embedding_id from chat_messages for a dog
export async function getMostRecentEmbeddingIdForDog(dogId) {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .filter('dog_ids', 'cs', `{"${dogId}"}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  if (error) {
    console.error("[getMostRecentEmbeddingIdForDog] Supabase error:", error);
    return null;
  }
  return data?.embedding_id || null;
}
