// src/dog_memories/models/dogMemoryModel.js

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default supabase;

const TABLE = 'dog_memories';

export async function insertDogMemory(data) {
  // data: { ...fields per CreateDogMemory }
  const { error, data: record } = await supabase
    .from(TABLE)
    .insert([data])
    .select()
    .single();
  if (error) throw error;
  return record;
}

export async function getDogMemoryById(id) {
  const { data: record, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return record;
}

export async function listDogMemoriesByDogId(dogId, { limit = 20, offset = 0 } = {}) {
  const { data: records, error } = await supabase
    .from(TABLE)
    .select('*')
    .contains('dog_ids', [dogId])
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return records;
}

export async function listDogMemoriesByUploader(userId, { limit = 20, offset = 0 } = {}) {
  const { data: records, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('uploader_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return records;
}

export async function updateDogMemory(id, updates) {
  const { data: record, error } = await supabase
    .from(TABLE)
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return record;
}

export async function deleteDogMemory(id) {
  const { data: record, error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return record;
}
