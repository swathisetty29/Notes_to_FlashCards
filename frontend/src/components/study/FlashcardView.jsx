import { useState, useEffect, useCallback } from "react";
import Flashcard from "./Flashcard";

export default function FlashcardView({ cards }) {
  const [index, setIndex] = useState(0);

  const goNext = useCallback(() => {
    setIndex((i) => Math.min(i + 1, cards.length - 1));
  }, [cards.length]);

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(i - 1, 0));
  }, []);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev]);

  const card = cards[index];

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <Flashcard card={card} cardNumber={index + 1} totalCards={cards.length} />
      <div className="flex items-center gap-3">
        <button
          onClick={goPrev}
          disabled={index === 0}
          className="rounded-md border-2 border-rule px-4 py-2 font-sans text-sm text-ink
                     disabled:opacity-40 disabled:pointer-events-none transition-all hover:border-ink hover:-translate-y-0.5 active:translate-y-0 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
        >
          ← Prev
        </button>
        <button
          onClick={goNext}
          disabled={index === cards.length - 1}
          className="rounded-md border-2 border-rule px-4 py-2 font-sans text-sm text-ink
                     disabled:opacity-40 disabled:pointer-events-none transition-all hover:border-ink hover:-translate-y-0.5 active:translate-y-0 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
        >
          Next →
        </button>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">Use ← → arrow keys to navigate, click the card to flip</p>
    </div>
  );
}

