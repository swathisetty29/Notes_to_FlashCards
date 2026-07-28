import { GoogleGenAI } from "@google/genai";
import { safeParseJson } from "../utils/extractJson.js";
import { validateCardSet } from "../validators/cardSetSchema.js";
import {
  buildSystemPrompt,
  buildUserPrompt,
  buildRetryPrompt,
  buildRefinePrompt,
} from "../prompts/cardPrompt.js";

const MODEL = "gemini-3.5-flash-lite";
const TIMEOUT_MS = 20_000;

let client = null;
function getClient() {
  if (!client) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set in the environment");
    }
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return client;
}

// Wraps a promise with a timeout so a hung request doesn't stall the request
// forever. Node's fetch has its own timeout defaults but they're generous,
// so we enforce a tighter one that matches what a user will tolerate.
function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("timeout")), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function callModel(prompt) {
  const ai = getClient();
  const response = await withTimeout(
    ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        systemInstruction: buildSystemPrompt(),
        responseMimeType: "application/json",
      },
    }),
    TIMEOUT_MS
  );
  return response.text ?? "";
}

/**
 * Runs one attempt: call model -> extract/parse JSON -> validate shape.
 * Returns { ok: true, data } or { ok: false, reason }.
 */
async function attempt(prompt) {
  let rawText;
  try {
    rawText = await callModel(prompt);
  } catch (err) {
    console.error("Gemini API Error:", err);
    return { ok: false, reason: err.message === "timeout" ? "timeout" : "network" };
  }

  if (!rawText || !rawText.trim()) {
    return { ok: false, reason: "empty" };
  }

  const parsed = safeParseJson(rawText);
  if (!parsed.success) {
    return { ok: false, reason: `malformed_json: ${parsed.error}` };
  }

  const validated = validateCardSet(parsed.data);
  if (!validated.success) {
    return { ok: false, reason: `wrong_shape: ${validated.error.message}` };
  }

  return { ok: true, data: validated.data };
}

/**
 * Public entry point. Tries once, and on any recoverable failure
 * (malformed JSON, wrong shape, empty response) retries exactly once
 * with a stricter prompt. Network/timeout failures are also retried once.
 * After two failures total, returns a structured error for the controller
 * to turn into an HTTP response - it never throws for expected failure modes.
 */
export async function generateCardSet(inputText) {
  const first = await attempt(buildUserPrompt(inputText));
  if (first.ok) return first;

  const retryPrompt = buildRetryPrompt(inputText, first.reason);
  const second = await attempt(retryPrompt);
  if (second.ok) return second;

  return {
    ok: false,
    reason: second.reason,
    attempts: [first.reason, second.reason],
  };
}

export async function refineCardSet(existingCards, instruction) {
  const refinePromptText = buildRefinePrompt(existingCards, instruction);
  const first = await attempt(refinePromptText);
  if (first.ok) return first;

  const retryPrompt = buildRetryPrompt(`Instruction: ${instruction}\nExisting Cards: ${JSON.stringify(existingCards)}`, first.reason);
  const second = await attempt(retryPrompt);
  if (second.ok) return second;

  return {
    ok: false,
    reason: second.reason,
    attempts: [first.reason, second.reason],
  };
}
