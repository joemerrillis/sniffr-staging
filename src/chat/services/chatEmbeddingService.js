// src/chat/services/chatEmbeddingService.js

/**
 * For each dog in dogIds, get the most recent embedded chat message's embedding_id mentioning that dog.
 * Returns: Array of { dog_id, embedding_id }
 */
export async function getMostRecentEmbeddingIdsForDogs(supabase, dogIds) {
  const results = [];
  for (const dog_id of dogIds) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('embedding_id')
      .contains('dog_ids', [dog_id])   // 'dog_ids' is an array column
      .not('embedding_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1);

    let embedding_id = null;
    if (error) {
      // Log error, or handle as you prefer
      console.error(`Error getting embedding_id for dog ${dog_id}:`, error);
    } else if (data && data.length && data[0].embedding_id) {
      embedding_id = data[0].embedding_id;
    }
    results.push({ dog_id, embedding_id });
  }
  return results;
}
