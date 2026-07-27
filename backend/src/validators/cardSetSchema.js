import { z } from "zod";

// A single flashcard. `options` is optional at the schema level because not
// every card is guaranteed to arrive with distractors, but our prompt always
// asks for 4. We validate loosely here and let the controller decide whether
// to treat missing options as fatal (see cardSetController).
export const cardSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1),
  answer: z.string().min(1),
  options: z.array(z.string().min(1)).min(2).max(6).optional(),
});

export const cardSetSchema = z.object({
  topic: z.string().min(1),
  cards: z.array(cardSchema).min(1).max(20),
});

/**
 * Validates raw parsed JSON against the card set shape.
 * Returns { success, data } or { success: false, error } (Zod-style),
 * never throws — callers decide what to do with a failure.
 */
export function validateCardSet(raw) {
  return cardSetSchema.safeParse(raw);
}
