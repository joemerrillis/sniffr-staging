// Disabled promptUtils. Functions now return empty strings (no-op).
// Restore real code if/when needed.

/**
 * Disabled buildTagsPrompt.
 * @returns {string} - always empty
 */
export function buildTagsPrompt() {
  return '';
}

/**
 * Disabled buildCaptionPrompt.
 * @returns {string} - always empty
 */
export function buildCaptionPrompt() {
  return '';
}

/*
=================================================
Original prompt utility implementations (commented out)
=================================================

// /**
//  * Builds a tags prompt for the tags-worker, based on known dog names.
//  * @param {Array<string>} dogNames - Array of dog names, may be empty or contain "Unknown".
//  * @returns {string} - Prompt for LLaVA.
//  */
// export function buildTagsPrompt(dogNames = []) {
//   const knownNames = dogNames.filter(n => n && n !== "Unknown");
//   if (knownNames.length === 1) {
//     return `List five short, comma-separated hashtags or descriptive words for this photo of a dog named ${knownNames[0]}.`;
//   } else if (knownNames.length > 1) {
//     return `List five short, comma-separated hashtags or descriptive words for this photo of dogs named ${knownNames.join(' and ')}.`;
//   } else {
//     return `List five short, comma-separated hashtags or descriptive words for this photo of a dog or multiple dogs.`;
//   }
// }

// /**
//  * Builds a caption prompt for the caption-worker.
//  * If the event_type is 'walk', prompt for an adventure-style caption.
//  * @param {Object} options
//  *   - dogNames: Array<string> (optional)
//  *   - eventType: string (e.g., 'walk', 'boarding', ...)
//  * @returns {string} - Prompt for LLaVA.
//  */
// export function buildCaptionPrompt({ dogNames = [], eventType } = {}) {
//   const knownNames = dogNames.filter(n => n && n !== "Unknown");
//   let namePart = "";

//   if (knownNames.length === 1) {
//     namePart = `the dog named ${knownNames[0]}`;
//   } else if (knownNames.length > 1) {
//     namePart = `the dogs named ${knownNames.join(' and ')}`;
//   } else {
//     namePart = `the dog`;
//   }

//   if (eventType === "walk") {
//     return `Write a lively, story-like one-sentence caption for this photo of ${namePart} on an outdoor adventure walk. Capture the excitement, energy, or curiosity of being out and about.`;
//   } else {
//     // Default: normal caption
//     return `Write a vivid, emotionally engaging one-sentence Instagram-style caption for this photo of ${namePart}. Keep it short and fun.`;
//   }
// }
*/
