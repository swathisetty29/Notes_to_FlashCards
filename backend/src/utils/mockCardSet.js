// Used only when GEMINI_API_KEY is missing, so the frontend<->backend
// pipe can be verified before any AI key is configured. Never used once
// a real key is present.
export function buildMockCardSet(inputText) {
  const topic = inputText?.slice(0, 40) || "Sample topic";
  return {
    topic,
    cards: [
      {
        id: "c1",
        question: "This is a mock question (no GEMINI_API_KEY set)",
        answer: "Mock answer",
        options: ["Mock answer", "Wrong 1", "Wrong 2", "Wrong 3"],
      },
      {
        id: "c2",
        question: "Add GEMINI_API_KEY to backend/.env to use the real model",
        answer: "Got it",
        options: ["Got it", "Not yet", "Maybe", "Skip"],
      },
    ],
  };
}
