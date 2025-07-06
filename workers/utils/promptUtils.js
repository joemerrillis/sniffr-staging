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

  // Instagram-style tag examples (not just #dog)
  const tagExamples = `
EXAMPLES:
#outdooradventure #dogsofinstagram #blackandwhitepup #happywalk #goofballenergy #queenattitude #sunnysniffs
`;

  if (personality && personality.length > 0) {
    return `List up to 7 short, comma-separated hashtags appropriate for Instagram for this photo of ${namePart}.
Take into account this personality profile: ${personality}
Do not use essay-length or multi-sentence tags. Each hashtag should be short, fun, and reflect the dog's energy/personality. Use only lowercase, remove spaces, and do not repeat the dog's name.
${tagExamples}`.trim();
  }
  // Fallback if no personality
  return `List up to 7 short, comma-separated hashtags appropriate for Instagram for this photo of ${namePart}.
Do not use essay-length or multi-sentence tags. Each hashtag should be short, fun, and reflect the dog's energy/personality. Use only lowercase, remove spaces, and do not repeat the dog's name.
${tagExamples}`.trim();
}

/**
 * Builds a caption prompt for the caption-worker.
 * Optionally includes a personality summary and always voices *as the dog* if available.
 * Prompts the model for a present-tense, in-the-moment, authentic inner monologue—NOT a self-intro or summary.
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

  // Inner monologue examples — Instagram, present tense, no self-intros
  const captionExamples = `
EXAMPLES:
1. "Let’s go, human! The world isn’t going to sniff itself."
2. "Did someone say treat? I’m on it!"
3. "That squirrel better watch out today."
4. "Nothing beats a sunny walk and belly rubs."
5. "So many smells, so little time!"
`;

  // If personality, instruct to use it in the inner monologue
  let voicePart = "";
  if (personalitySummary && personalitySummary.trim()) {
    voicePart = `
Base the caption on the following personality profile: ${personalitySummary.trim()}
Do not mention the dog's name, do not introduce yourself, and do not summarize. Write only what the dog would be thinking or feeling in this exact moment, in first person, present tense.
`.trim();
  } else {
    voicePart = `
Do not mention the dog's name, do not introduce yourself, and do not summarize. Write only what the dog would be thinking or feeling in this exact moment, in first person, present tense.
`.trim();
  }

  if (eventType === "walk") {
    return `
Write a fun, present-tense Instagram caption for this photo of ${namePart} on an outdoor adventure walk.
The caption must sound like the dog's own thoughts, in first person, but do NOT use the dog's name or introduce yourself.
Start with what the dog is thinking or feeling in the moment. Keep it authentic and playful. One sentence only.
${voicePart}
${captionExamples}
`.trim();
  } else {
    // Default: normal caption
    return `
Write a vivid, emotionally engaging one-sentence Instagram caption for this photo of ${namePart}.
The caption must sound like the dog's own thoughts, in first person, but do NOT use the dog's name or introduce yourself.
Start with what the dog is thinking or feeling in the moment. Keep it authentic and playful. One sentence only.
${voicePart}
${captionExamples}
`.trim();
  }
}
