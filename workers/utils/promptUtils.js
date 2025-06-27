// src/dog_memories/utils/promptUtils.js

/**
 * Builds a tags prompt for the tags-worker, based on known dog names.
 * @param {Array<string>} dogNames - Array of dog names, may be empty or contain "Unknown".
 * @returns {string} - Prompt for LLaVA.
 */
export function buildTagsPrompt(dogNames = []) {
  const knownNames = dogNames.filter(n => n && n !== "Unknown");
  if (knownNames.length === 1) {
    return `List five short, comma-separated hashtags or descriptive words for this photo of a dog named ${knownNames[0]}.`;
  } else if (knownNames.length > 1) {
    return `List five short, comma-separated hashtags or descriptive words for this photo of dogs named ${knownNames.join(' and ')}.`;
  } else {
    return `List five short, comma-separated hashtags or descriptive words for this photo of a dog or multiple dogs.`;
  }
}

/**
 * Builds a caption prompt for the caption-worker.
 * Optionally includes a personality summary (from designer worker).
 * @param {Object} options
 *   - dogNames: Array<string> (optional)
 *   - eventType: string (e.g., 'walk', 'boarding', ...)
 *   - personalitySummary: string (optional, e.g. "Goofy, obsessed with squirrels, loves belly rubs")
 * @returns {string} - Prompt for LLaVA.
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

  // Add the personality info if provided
  let personalityPart = "";
  if (personalitySummary && personalitySummary.trim()) {
    personalityPart = ` Channel this personality in the dog's voice: ${personalitySummary.trim()}.`;
  }

  if (eventType === "walk") {
    return `Write a lively, story-like one-sentence caption for this photo of ${namePart} on an outdoor adventure walk. Capture the excitement, energy, or curiosity of being out and about.${personalityPart}`;
  } else {
    // Default: normal caption
    return `Write a vivid, emotionally engaging one-sentence Instagram-style caption for this photo of ${namePart}.${personalityPart} Keep it short and fun.`;
  }
}
