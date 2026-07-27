/**
 * LLMs asked for "JSON only" still sometimes wrap it in markdown fences,
 * or add a sentence like "Here's your flashcards:" before the object.
 * This strips that noise down to the substring that's actually parseable.
 *
 * It does not try to fix broken JSON syntax (trailing commas, unquoted
 * keys, etc.) - that's a much deeper rabbit hole. Instead, when the model
 * gives us syntactically invalid JSON, we throw it away and ask the model
 * to regenerate with a stricter prompt (see geminiService.retry logic).
 * That's more reliable than guessing how to patch arbitrary broken JSON.
 */
export function extractJson(rawText) {
  if (typeof rawText !== "string") return null;

  let text = rawText.trim();

  // Strip ```json ... ``` or ``` ... ``` fences
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    text = fenceMatch[1].trim();
  }

  // If there's still leading/trailing prose, grab the first {...} block
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    text = text.slice(firstBrace, lastBrace + 1);
  }

  return text;
}

/**
 * Attempts JSON.parse on extracted text. Never throws - returns
 * { success: true, data } or { success: false, error }.
 */
export function safeParseJson(rawText) {
  const extracted = extractJson(rawText);
  if (!extracted) {
    return { success: false, error: "Empty or non-string response" };
  }
  try {
    const data = JSON.parse(extracted);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
