import { useState, useEffect } from "react";
import FlashcardView from "./FlashcardView";
import QuizView from "./QuizView";
import QuizResults from "./QuizResults";

export default function StudySession({ topic, cards, onSave }) {
  const [mode, setMode] = useState(() => {
    return localStorage.getItem("studyState_quiz_mode") || "flashcards";
  }); // 'flashcards' | 'quiz' | 'results'
  
  const [quizCards, setQuizCards] = useState(() => {
    const saved = localStorage.getItem("studyState_quiz_cards");
    return saved ? JSON.parse(saved) : cards;
  }); // subset used for current quiz run (all, or retest set)
  
  const [lastResult, setLastResult] = useState(() => {
    const saved = localStorage.getItem("studyState_quiz_result");
    return saved ? JSON.parse(saved) : null;
  });
  
  // quizKey forces QuizView to remount (fresh internal state) whenever we
  // start a new quiz run, rather than trying to reset its internals manually.
  const [quizKey, setQuizKey] = useState(0);

  // If the upstream `cards` prop changes (e.g. refined or regenerated same topic),
  // we must update our local quizCards subset to match and reset the quiz.
  const [prevCards, setPrevCards] = useState(cards);
  if (cards !== prevCards) {
    setPrevCards(cards);
    setQuizCards(cards);
    setMode("flashcards");
    setLastResult(null);
  }

  useEffect(() => {
    localStorage.setItem("studyState_quiz_mode", mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem("studyState_quiz_cards", JSON.stringify(quizCards));
  }, [quizCards]);

  useEffect(() => {
    if (lastResult) localStorage.setItem("studyState_quiz_result", JSON.stringify(lastResult));
    else localStorage.removeItem("studyState_quiz_result");
  }, [lastResult]);

  function startQuiz(cardSubset = cards) {
    setQuizCards(cardSubset);
    setMode("quiz");
    setQuizKey((k) => k + 1);
  }

  function handleQuizFinish(result) {
    setLastResult(result);
    setMode("results");
  }

  function handleRetestWrong() {
    const wrongCards = quizCards.filter((c) => lastResult.wrongIds.includes(c.id));
    startQuiz(wrongCards);
  }

  const [hasSaved, setHasSaved] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <p className="font-sans text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400">Topic</p>
            {onSave && (
              <button
                onClick={() => {
                  setHasSaved(true);
                  onSave();
                }}
                className="relative rounded-full bg-rule/40 px-2.5 py-0.5 font-sans text-[10px] font-bold text-ink uppercase tracking-widest transition-all hover:bg-rule/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
              >
                Save Deck
                {!hasSaved && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-correct opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-correct"></span>
                  </span>
                )}
              </button>
            )}
          </div>
          <h2 className="font-display text-xl text-ink">{topic}</h2>
        </div>
        <div className="flex gap-2">
          <ModeButton active={mode === "flashcards"} onClick={() => setMode("flashcards")}>
            Flashcards
          </ModeButton>
          <ModeButton active={mode === "quiz" || mode === "results"} onClick={() => startQuiz(cards)}>
            Quiz
          </ModeButton>
        </div>
      </div>

      {mode === "flashcards" && <FlashcardView cards={cards} />}

      {mode === "quiz" && (
        <QuizView key={quizKey} cards={quizCards} onFinish={handleQuizFinish} />
      )}

      {mode === "results" && lastResult && (
        <QuizResults
          correctCount={lastResult.correctCount}
          total={lastResult.total}
          wrongCount={lastResult.wrongIds.length}
          onRetestWrong={handleRetestWrong}
          onRestartAll={() => startQuiz(cards)}
          onSwitchToFlashcards={() => setMode("flashcards")}
        />
      )}
    </div>
  );
}

function ModeButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-4 py-2 font-sans text-sm transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 border-2 ${
        active
          ? "bg-ink text-paper-card border-ink focus-visible:ring-ink dark:focus-visible:ring-offset-[#12141A]"
          : "bg-transparent text-ink border-rule hover:border-ink focus-visible:ring-ink dark:focus-visible:ring-offset-[#12141A]"
      }`}
    >
      {children}
    </button>
  );
}

