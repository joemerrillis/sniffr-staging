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
    namePart = knownNames[0];
  } else if (knownNames.length > 1) {
    namePart = knownNames.join(' and ');
  } else {
    namePart = "";
  }

  let personalityPart = personality && personality.length > 0
    ? `The dog's personality: ${personality}`
    : "";

  // Instagram-specific: ask for up to 7 hashtags (comma separated, not an essay)
  let instruction = `Generate up to 7 Instagram-appropriate hashtags for this photo. Hashtags should be short (1-3 words), expressive, and can highlight mood, appearance, or quirks. Return as a single, comma-separated list. ${personalityPart}`;

  if (namePart) {
    instruction = `Generate up to 7 Instagram-appropriate hashtags for a photo of ${namePart}. Hashtags should be short (1-3 words), expressive, and can highlight mood, appearance, or quirks. Return as a single, comma-separated list. ${personalityPart}`;
  }

  return instruction.trim();
}


/**
 * Builds a caption prompt for the caption-worker.
 * Produces a strictly first-person, in-dog's-voice caption. Gives good/bad examples to steer the LLM.
 * @param {Object} options
 *   - dogNames: Array<string> (optional)
 *   - eventType: string (e.g., 'walk', 'boarding', ...)
 *   - personalitySummary: string (optional)
 * @returns {string} - Prompt for LLM or LLaVA.
 */
export function buildCaptionPrompt({ dogNames = [], eventType, personalitySummary } = {}) {
  const knownNames = dogNames.filter(n => n && n !== "Unknown");
  let namePart = "";
  if (knownNames.length === 1) {
    namePart = knownNames[0];
  } else if (knownNames.length > 1) {
    namePart = knownNames.join(' and ');
  } else {
    namePart = "";
  }

  let personaPart = personalitySummary && personalitySummary.trim()
    ? `Use this dog's personality profile: ${personalitySummary.trim()}`
    : "";

  // Give strict, example-based guidance
  const negative = namePart
    ? `Do NOT start with "As ${namePart}" or "${namePart} is". Do NOT describe yourself in the third person.`
    : `Do NOT start with "As this dog" or "This dog is". Do NOT describe yourself in the third person.`;
  const positive = namePart
    ? `Write a short, vivid, first-person caption as if you are ${namePart}, narrating your own walk. Begin with "I" or an action word.`
    : `Write a short, vivid, first-person caption as if you are the dog, narrating your own walk. Begin with "I" or an action word.`;

  const example = namePart
    ? `
Examples:
- Good: "I spotted three squirrels and almost caught one!"
- Good: "Nothing better than a belly rub after a long walk."
- Bad: "As ${namePart}, I spotted three squirrels..."
- Bad: "${namePart} is a playful dog who loves walks."
`
    : `
Examples:
- Good: "I spotted three squirrels and almost caught one!"
- Good: "Nothing better than a belly rub after a long walk."
- Bad: "As this dog, I spotted three squirrels..."
- Bad: "This dog is a playful dog who loves walks."
`;

  let corePrompt = "";

  if (eventType === "walk") {
    corePrompt = `Write a lively, one-sentence Instagram caption for a photo taken on a walk. ${personaPart} ${positive} ${negative} ${example}`;
  } else {
    corePrompt = `Write a vivid, emotionally engaging one-sentence Instagram caption for a photo. ${personaPart} ${positive} ${negative} ${example}`;
  }

  return corePrompt.trim();
}
