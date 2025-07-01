// src/dog_memories/utils/promptUtils.js

/**
 * Builds a tags prompt for the tags-worker, based on known dog names and personality summary.
 * @param {Array<string>} dogNames - Array of dog names, may be empty or contain "Unknown".
 * @param {string} personality - Personality summary or description.
 * @returns {string} - Prompt for LLM or LLaVA.
 */
export function buildTagsPrompt(dogNames = [], personality = "") {
  const knownNames = dogNames.filter(n => n && n !== "Unknown");
  let namePart = "";
  if (knownNames.length === 1) {
    namePart = `the dog named ${knownNames[0]}`;
  } else if (knownNames.length > 1) {
    namePart = `the dogs named ${knownNames.join(' and ')}`;
  } else {
    namePart = `the dog`;
  }
  if (personality && personality.length > 0) {
    return `List five short, comma-separated hashtags or descriptive words for this photo of ${namePart}. Take into account this personality profile: ${personality}`;
  }
  // Fallback if no personality
  return `List five short, comma-separated hashtags or descriptive words for this photo of ${namePart}.`;
}


/**
 * Builds a caption prompt for the caption-worker.
 * Optionally includes a personality summary (from designer/worker) and always voices *as the dog* if available.
 * @param {Object} options
 *   - dogNames: Array<string> (optional)
 *   - eventType: string (e.g., 'walk', 'boarding', ...)
 *   - personalitySummary: string (optional, e.g. "Goofy, obsessed with squirrels, loves belly rubs")
 * @returns {string} - Prompt for LLM or LLaVA.
 */
export function buildCaptionPrompt({ dogNames = [], eventType, personalitySummary } = {}) {
  const knownNames = dogNames.filter(n => n && n !== "Unknown");
  let namePart = "";

  if (knownNames.length === 1) {
    namePart = `the dog named ${knownNames[0]}`;
  } else if (knownNames.length > 1) {
    namePart = `the dogs named ${knownNames.join(' and ')}`;
  } else {
    namePart = `the dog`;
  }

  // Encourage caption in dog's voice if personality is provided
  let voicePart = "";
  if (personalitySummary && personalitySummary.trim()) {
    voicePart = ` Write an Instagram caption as if you are this dog, speaking in the first person, using the following personality: ${personalitySummary.trim()}. Make it fun, expressive, and unique to this dog.`;
  }

  if (eventType === "walk") {
    return `Write a lively, story-like one-sentence caption for this photo of ${namePart} on an outdoor adventure walk. Capture the excitement, energy, or curiosity of being out and about.${voicePart}`;
  } else {
    // Default: normal caption
    return `Write a vivid, emotionally engaging one-sentence Instagram-style caption for this photo of ${namePart}.${voicePart} Keep it short and fun.`;
  }
}
