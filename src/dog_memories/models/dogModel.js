// src/dog_memories/models/dogModel.js

import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export async function getDogById(dogId) {
  const { data, error } = await supabase
    .from('dogs')
    .select('*')
    .eq('id', dogId)
    .single();
  if (error) {
    console.error('[getDogById] Supabase error:', error);
    return null;
  }
  return data;
}
