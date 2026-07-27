import { useState, useEffect } from "react";

export default function Flashcard({ card, cardNumber, totalCards }) {
  const [flipped, setFlipped] = useState(false);

  // Reset flip state whenever we move to a different card.
  useEffect(() => {
    setFlipped(false);
  }, [card.id]);

  function toggle() {
    setFlipped((f) => !f);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
  }

  return (
    <div className="flex flex-col items-center w-full">
      <p className="font-sans text-xs text-slate-500 dark:text-slate-400 mb-3 tracking-widest">
        CARD {cardNumber} / {totalCards}
      </p>
      <div
        role="button"
        tabIndex={0}
        aria-pressed={flipped}
        aria-label={flipped ? "Showing answer, press to show question" : "Showing question, press to show answer"}
        onClick={toggle}
        onKeyDown={handleKeyDown}
        className="w-full max-w-md h-56 cursor-pointer select-none"
        style={{ perspective: "1200px" }}
      >
        <div
          className="relative w-full h-full transition-transform duration-500"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Front - question */}
          <div
            className="absolute inset-0 rounded-xl border-2 border-rule bg-paper-card p-6
                       flex flex-col justify-center items-center text-center shadow-sm"
            style={{ backfaceVisibility: "hidden" }}
          >
            <p className="font-sans text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">Question</p>
            <p className="font-display text-xl text-ink leading-snug">{card.question}</p>
            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">Tap to flip</p>
          </div>

          {/* Back - answer */}
          <div
            className="absolute inset-0 rounded-xl border-2 border-ink bg-ink p-6
                       flex flex-col justify-center items-center text-center shadow-sm"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <p className="font-sans text-[10px] uppercase tracking-widest text-paper-card/60 mb-3">Answer</p>
            <p className="font-display text-xl text-paper-card leading-snug">{card.answer}</p>
            <p className="mt-4 text-xs text-paper-card/60">Tap to flip back</p>
          </div>
        </div>
      </div>
    </div>
  );
}

