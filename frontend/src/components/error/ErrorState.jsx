const MESSAGES = {
  TIMEOUT: "The AI took too long to respond.",
  NETWORK_ERROR: "Couldn't reach the server.",
  EMPTY_RESPONSE: "The AI returned an empty response.",
  MALFORMED_JSON: "The AI response wasn't valid JSON.",
  INVALID_SHAPE: "The AI response didn't match the expected format.",
  INVALID_INPUT: "Please add a bit more detail and try again.",
};

export default function ErrorState({ error, onRetry }) {
  const message =
    (error?.code && MESSAGES[error.code]) ||
    error?.message ||
    "Something went wrong generating your flashcards.";

  return (
    <div
      role="alert"
      className="rounded-lg border-2 border-wrong/40 bg-wrong/5 px-6 py-8 text-center"
    >
      <p className="font-display text-lg text-ink mb-1">Couldn't generate your flashcards</p>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">{message}</p>
      <button
        onClick={onRetry}
        className="rounded-md bg-ink px-5 py-2 font-sans text-sm font-bold text-paper-card
                   transition-transform hover:-translate-y-0.5 active:translate-y-0"
      >
        Try again
      </button>
    </div>
  );
}

