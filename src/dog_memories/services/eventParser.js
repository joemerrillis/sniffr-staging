// src/dog_memories/service/eventParser.js

import fetch from 'node-fetch';

const WORKER_URL = process.env.CF_TRANSCRIPT_EVENT_WORKER_URL;

/**
 * Calls the event-worker to parse a caption or transcript for events/tags.
 * @param {string} transcript - The saved caption, transcript, or text to analyze.
 * @param {string[]} tags - (Optional) Tags array, can be passed as meta.
 * @param {object} memory - (Optional) Additional info, e.g., for event_id, dog_ids, etc.
 * @returns {Promise<Array>} Parsed events/tags from the worker (empty array on error).
 */
export async function parseCaptionForEvents(transcript, tags = [], memory = {}) {
  if (!WORKER_URL) throw new Error("CF_TRANSCRIPT_EVENT_WORKER_URL env var not set.");

  const payload = {
    transcript,
    max_completion_tokens: 2048,
    meta: {
      ...memory,
      tags: tags || [],
    }
  };

  let output = [];
  try {
    const res = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Event worker error: ${err}`);
    }

    const json = await res.json();
    output = Array.isArray(json.output) ? json.output : [];
  } catch (err) {
    // Log error but don’t throw, just return []
    console.error("[EventParser] Failed to call event worker:", err);
    output = [];
  }
  return output;
}
