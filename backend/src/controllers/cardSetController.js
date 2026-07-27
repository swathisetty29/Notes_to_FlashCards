import { generateCardSet, refineCardSet } from "../services/geminiService.js";
import { buildMockCardSet } from "../utils/mockCardSet.js";

const MIN_INPUT_LENGTH = 8;

function isMeaningfulInput(text) {
  return typeof text === "string" && text.trim().length >= MIN_INPUT_LENGTH;
}

// Maps internal failure reasons to a stable error code the frontend can
// switch on, plus a human-readable message as a fallback.
function reasonToErrorResponse(reason) {
  if (reason === "timeout") {
    return { code: "TIMEOUT", message: "The AI took too long to respond." };
  }
  if (reason === "network") {
    return { code: "NETWORK_ERROR", message: "Couldn't reach the AI service." };
  }
  if (reason === "empty") {
    return { code: "EMPTY_RESPONSE", message: "The AI returned an empty response." };
  }
  if (reason?.startsWith("malformed_json")) {
    return { code: "MALFORMED_JSON", message: "The AI response wasn't valid JSON." };
  }
  if (reason?.startsWith("wrong_shape")) {
    return { code: "INVALID_SHAPE", message: "The AI response didn't match the expected format." };
  }
  return { code: "UNKNOWN", message: "Something went wrong generating your flashcards." };
}

export async function generateCards(req, res) {
  const { text } = req.body ?? {};

  if (!isMeaningfulInput(text)) {
    return res.status(400).json({
      error: {
        code: "INVALID_INPUT",
        message: "Please provide at least a few words of notes or a topic.",
      },
    });
  }

  // No API key configured yet -> serve mock data so the rest of the app
  // (frontend, states, interactions) can be built and tested immediately.
  if (!process.env.GEMINI_API_KEY) {
    return res.status(200).json({ data: buildMockCardSet(text), mocked: true });
  }

  const result = await generateCardSet(text.trim());

  if (result.ok) {
    return res.status(200).json({ data: result.data });
  }

  const { code, message } = reasonToErrorResponse(result.reason);
  // 502: upstream (the model) failed, this isn't a client input error.
  return res.status(502).json({ error: { code, message } });
}

export async function refineCards(req, res) {
  const { existingCards, instruction } = req.body ?? {};

  if (!existingCards || !isMeaningfulInput(instruction)) {
    return res.status(400).json({
      error: {
        code: "INVALID_INPUT",
        message: "Please provide existing cards and a meaningful instruction.",
      },
    });
  }

  if (!process.env.GEMINI_API_KEY) {
    // Just return the existing cards if mock is active (or could mock a change).
    // The instructions don't strictly specify how mock refinement should behave.
    return res.status(200).json({ data: existingCards, mocked: true });
  }

  const result = await refineCardSet(existingCards, instruction.trim());

  if (result.ok) {
    return res.status(200).json({ data: result.data });
  }

  const { code, message } = reasonToErrorResponse(result.reason);
  return res.status(502).json({ error: { code, message } });
}
