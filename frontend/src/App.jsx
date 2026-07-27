import { useState, useEffect } from "react";
import { useCardGeneration } from "./hooks/useCardGeneration";
import TopicInput from "./components/input/TopicInput";
import CardSkeleton from "./components/loading/CardSkeleton";
import ErrorState from "./components/error/ErrorState";
import EmptyState from "./components/error/EmptyState";
import StudySession from "./components/study/StudySession";

export default function App() {
  const { status, cards, topic, error, generate, refine, reset, clearSession, retry, savedDecks, saveDeck, deleteDeck, loadDeck } = useCardGeneration();
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("studyState_theme") === "dark";
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("studyState_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("studyState_theme", "light");
    }
  }, [isDark]);

  return (
    <div className="min-h-screen bg-paper transition-colors duration-200">
      <header className="ruled-bg border-b-2 border-rule">
        <div className="max-w-3xl mx-auto px-6 py-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="font-sans text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                Study Assistant
              </p>
              <h1 className="font-display text-3xl sm:text-4xl text-ink">
                Turn any notes into flashcards
              </h1>
            </div>
            <button
              onClick={() => setIsDark(d => !d)}
              className="p-2 -mr-2 rounded-full border-2 border-transparent hover:border-rule hover:bg-rule/10 text-ink transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
              aria-label="Toggle dark mode"
            >
              {isDark ? "☀️" : "🌙"}
            </button>
          </div>
          
          {savedDecks.length > 0 && (
            <div className="mb-8">
              <p className="font-sans text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">
                Saved Decks
              </p>
              <div className="flex flex-wrap gap-2">
                {savedDecks.map((deck) => (
                  <div key={deck.id} className="group flex items-center gap-1 rounded-full border-2 border-rule bg-paper-card pl-4 pr-1 py-1 transition-all hover:border-ink">
                    <button 
                      onClick={() => loadDeck(deck)}
                      className="font-sans text-sm text-ink truncate max-w-[200px] text-left focus-visible:outline-none"
                    >
                      {deck.topic}
                    </button>
                    <button
                      onClick={() => deleteDeck(deck.id)}
                      className="p-1.5 rounded-full text-slate-400 hover:text-wrong hover:bg-wrong/10 transition-colors focus-visible:outline-none"
                      aria-label="Delete saved deck"
                      title="Delete deck"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="w-full">
            <TopicInput onGenerate={generate} isLoading={status === "loading"} />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {status === "idle" && <EmptyState />}
        {status === "loading" && <CardSkeleton />}
        {status === "error" && <ErrorState error={error} onRetry={retry} />}
        {status === "ready" && cards && (
          <>
            <StudySession key={topic} topic={topic} cards={cards} onSave={saveDeck} />
            
            <div className="mt-8 border-t-2 border-rule pt-8 w-full max-w-lg mx-auto">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const val = e.target.elements.refinement.value.trim();
                  if (val) refine(val);
                  e.target.reset();
                }}
                className="flex flex-col sm:flex-row gap-3 items-center"
              >
                <input 
                  type="text" 
                  name="refinement"
                  placeholder="e.g., make these harder, add 3 more cards..." 
                  className="w-full resize-none rounded-lg border-2 border-rule bg-paper-card px-4 py-2 font-body text-ink placeholder:text-slate-500 dark:text-slate-400/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:border-ink transition-all hover:border-ink/50"
                />
                <button type="submit" className="shrink-0 rounded-md bg-ink px-4 py-2 font-sans text-sm font-bold text-paper-card transition-all hover:-translate-y-0.5 hover:opacity-90 active:translate-y-0 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ink dark:focus-visible:ring-offset-[#12141A]">
                  Refine
                </button>
              </form>
            </div>

            <div className="mt-10 text-center flex flex-col gap-3 items-center">
              <button
                onClick={reset}
                className="font-sans text-xs text-slate-500 dark:text-slate-400 hover:text-ink underline underline-offset-4"
              >
                Start a new set
              </button>
              <button
                onClick={clearSession}
                className="font-sans text-xs text-wrong hover:text-ink underline underline-offset-4"
              >
                Clear session
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

