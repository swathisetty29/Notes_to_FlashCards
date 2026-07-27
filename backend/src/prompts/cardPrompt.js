const SCHEMA_DESCRIPTION = `{
  "topic": "short topic name",
  "cards": [
    {
      "id": "c1",
      "question": "string",
      "answer": "string",
      "options": ["string", "string", "string", "string"]
    }
  ]
}`;

export function buildSystemPrompt() {
  return [
    "You are a flashcard generator for a study app.",
    "Return ONLY valid JSON. No markdown, no code fences, no explanation, no commentary before or after.",
    "Follow this exact shape:",
    SCHEMA_DESCRIPTION,
    "Rules:",
    "- Generate between 6 and 12 cards depending on how much material the input supports.",
    "- Every card must have a unique id (c1, c2, c3, ...).",
    "- `options` must contain the correct answer plus 3 plausible wrong answers, in random order.",
    "- Keep questions and answers concise (a sentence or less).",
    "- Base every card strictly on the input text/topic provided by the user. Do not invent unrelated content.",
    "- Output raw JSON as your entire response. The first character must be '{'.",
  ].join("\n");
}

export function buildUserPrompt(inputText) {
  return `Generate flashcards from the following notes or topic:\n\n${inputText}`;
}

// Used on the single retry after a validation failure - more forceful,
// and reminds the model what went wrong.
export function buildRetryPrompt(inputText, previousError) {
  return [
    buildUserPrompt(inputText),
    "",
    `Your previous response was invalid: ${previousError}`,
    "This time, return ONLY the raw JSON object, starting with '{' and ending with '}'. Nothing else.",
  ].join("\n");
}

export function buildRefinePrompt(existingCards, instruction) {
  return [
    "Here is the existing flashcard set in JSON format:",
    JSON.stringify(existingCards, null, 2),
    "",
    "Based on the following instruction, modify the existing flashcard set, retaining the current topic, and return a new JSON object.",
    "Do NOT change the topic unless instructed to. Update the cards array as requested.",
    `Instruction: ${instruction}`,
  ].join("\n");
}
