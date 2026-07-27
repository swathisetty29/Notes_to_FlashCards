export default function QuizResults({ correctCount, total, wrongCount, onRetestWrong, onRestartAll, onSwitchToFlashcards }) {
  return (
    <div className="flex flex-col items-center gap-5 text-center max-w-md mx-auto">
      <p className="font-sans text-xs text-slate-500 dark:text-slate-400 tracking-widest">RESULTS</p>
      <p className="font-display text-3xl text-ink">
        {correctCount} / {total}
      </p>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {wrongCount === 0
          ? "Perfect score — nice work."
          : `${wrongCount} card${wrongCount === 1 ? "" : "s"} to review.`}
      </p>
      <div className="flex flex-wrap justify-center gap-3 mt-2">
        {wrongCount > 0 && (
          <button
            onClick={onRetestWrong}
            className="rounded-md bg-ink px-5 py-2 font-sans text-sm font-bold text-paper-card
                       transition-transform hover:-translate-y-0.5 active:translate-y-0"
          >
            Retest wrong answers
          </button>
        )}
        <button
          onClick={onRestartAll}
          className="rounded-md border-2 border-rule px-5 py-2 font-sans text-sm text-ink
                     hover:border-ink transition-colors"
        >
          Restart full quiz
        </button>
        <button
          onClick={onSwitchToFlashcards}
          className="rounded-md border-2 border-rule px-5 py-2 font-sans text-sm text-ink
                     hover:border-ink transition-colors"
        >
          Back to flashcards
        </button>
      </div>
    </div>
  );
}

