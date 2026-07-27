import { useState } from "react";

const MIN_LENGTH = 8;

export default function TopicInput({ onGenerate, isLoading }) {
  const [text, setText] = useState("");
  const [touched, setTouched] = useState(false);

  const trimmed = text.trim();
  const validationMessage =
    trimmed.length === 0
      ? "Please paste some notes or describe a topic."
      : trimmed.length < MIN_LENGTH
      ? "A little more detail helps — try a full sentence or two."
      : null;

  function handleSubmit(e) {
    e.preventDefault();
    setTouched(true);
    if (validationMessage) return;
    onGenerate(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <label
        htmlFor="topic-input"
        className="block font-sans text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2"
      >
        Notes or topic
      </label>
      <textarea
        id="topic-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => setTouched(true)}
        placeholder="Paste your notes, or just name a topic — e.g. 'The French Revolution' or 'React useEffect cleanup functions'"
        rows={5}
        className="w-full resize-none rounded-lg border-2 border-rule bg-paper-card px-4 py-3
                   font-body text-ink placeholder:text-slate-500 dark:text-slate-400/60
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:border-ink
                   hover:border-ink/50 transition-all"
        disabled={isLoading}
      />
      <div className="mt-2 flex items-start justify-between gap-4 min-h-[1.5rem]">
        <p
          className="text-sm text-wrong"
          role="alert"
          aria-live="polite"
        >
          {touched && validationMessage ? validationMessage : ""}
        </p>
        <button
          type="submit"
          disabled={isLoading}
          className="shrink-0 rounded-md bg-ink px-5 py-2 font-sans text-sm font-bold text-paper-card
                     transition-all hover:-translate-y-0.5 hover:opacity-90 active:translate-y-0 active:scale-95
                     disabled:opacity-50 disabled:pointer-events-none
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ink dark:focus-visible:ring-offset-[#12141A]"
        >
          {isLoading ? "Generating…" : "Generate flashcards"}
        </button>
      </div>
    </form>
  );
}

