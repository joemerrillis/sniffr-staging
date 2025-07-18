// src/dog_memories/service/eventParser.js

// Dummy event parser - replace with real NLP or AI logic as you build it!
export async function parseCaptionForEvents(caption, tags, memory) {
  // Example: If caption mentions "birthday", create an event
  const events = [];
  if (caption.toLowerCase().includes('birthday')) {
    events.push({ type: 'birthday', dog_ids: memory.dog_ids, date: memory.created_at });
  }
  // Expand with real logic or AI call
  return events;
}
