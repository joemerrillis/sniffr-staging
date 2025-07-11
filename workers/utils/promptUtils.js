// src/dog_memories/utils/promptUtils.js

// ---------- Instagram Tags Prompt ----------
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

// ---------- Caption Prompt ----------
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

  const captionExamples = `
EXAMPLES:
1. "Let’s go, human! The world isn’t going to sniff itself."
2. "Did someone say treat? I’m on it!"
3. "That squirrel better watch out today."
4. "Nothing beats a sunny walk and belly rubs."
5. "So many smells, so little time!"
`;

  let voicePart = "";
  if (personalitySummary && personalitySummary.trim()) {
    voicePart = `
Base the caption on the following personality profile: ${personalitySummary.trim()}
Don’t introduce yourself. Just narrate your excitement, actions, or mood in first-person.
`.trim();
  } else {
    voicePart = `
Don’t introduce yourself. Just narrate your excitement, actions, or mood in first-person. Make it sound like an internal monologue.
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

// ---------- Walk Summary Prompt ----------
export function buildSummaryPrompt({ photos, personalities = [], dogNames = [] }) {
  let photoDescriptions = photos.map((photo, i) =>
    `Photo ${i + 1}: ${photo.ai_caption}${photo.tags ? ' (tags: ' + photo.tags.join(', ') + ')' : ''}`
  ).join('\n');

  let dogsLine = dogNames.length > 0
    ? `Dogs on this walk: ${dogNames.join(', ')}.\n`
    : '';

  let personalityNote = personalities.length
    ? `\nPersonality details: ${personalities.join('\n')}\n`
    : '';

  return `
${dogsLine}
${personalityNote}
Below is a sequence of AI-generated captions for each photo taken on a dog walk. Write a friendly, energetic 2-3 sentence summary to send to the dog's human. Reference specific moments or moods from the captions, avoid repeating the captions directly, and focus on what made this walk special for the dogs. Don't repeat the dog's name every sentence. No bullet points. Write naturally as the walker or a friendly assistant.

${photoDescriptions}

Summary:
`.trim();
}

// ---------- Event/Tag Extraction Prompt ----------
export function buildEventTagPrompt({ transcript }) {
  return `
Your job is to extract only events that inform us about the dog's experience, state of mind, or personality during the walk. Do NOT create events for human background actions (like closing doors, putting on shoes, opening gates) unless it clearly relates to the dog's reaction or mood. Focus on moments that reveal how the dog interacts with their environment, their human, or other dogs.

For each meaningful event, provide:
- "text": a single sentence describing the event, rephrased in a way that emphasizes the dog's perspective, mood, or response. Be specific.
For each tag, provide:
- "name": the tag (a single word or short phrase)
- "emoji": a single emoji matching the tag meaning (use your best guess)
- "description": a very short phrase (max 6 words) that gives a general definition of the tag, not specific to this walk or place.


Example output:
[
  {
    "text": "Juno cried with joy at being picked up for her walk.",
    "tags": [
      { "name": "joy", "emoji": "😄", "description": "Expressed happiness" },
      { "name": "pickup", "emoji": "🦮", "description": "Picked up for walk" }
    ]
  },
  {
    "text": "She got all her cuddles on the park bench.",
    "tags": [
      { "name": "cuddle", "emoji": "🤗", "description": "Sought physical affection" },
      { "name": "park", "emoji": "🏞️", "description": "At the dog park" }
    ]
  },
  {
    "text": "She pooped a second time on the way home.",
    "tags": [
      { "name": "poop", "emoji": "💩", "description": "Had a bowel movement" },
      { "name": "home", "emoji": "🏠", "description": "Returning home" }
    ]
  }
]

Transcript:
"""${transcript}"""

Return only a valid JSON array in the format shown above.
`.trim();
}
