import { useState, useMemo, useEffect, useRef } from "react";
import { shuffle } from "../../utils/shuffle";

// Cards without options (e.g. AI omitted them) fall back to a simple
// two-choice "reveal" flow instead of breaking the quiz.
function optionsFor(card) {
  if (card.options && card.options.length >= 2) {
    // In case the AI hallucinated options that don't include the actual answer
    if (!card.options.includes(card.answer)) {
      return [...card.options.slice(0, 3), card.answer];
    }
    return card.options;
  }
  return [card.answer, "I'm not sure"];
}

export default function QuizView({ cards, onFinish }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [wrongIds, setWrongIds] = useState([]);
  const [correctCount, setCorrectCount] = useState(0);

  // Refs mirror the latest state so event handlers never suffer from
  // stale-closure reads — especially critical on the final question
  // where React may not have flushed the setState from handleSelect
  // before handleNext reads the tally.
  const correctRef = useRef(0);
  const wrongRef = useRef([]);

  const card = cards[index];
  const options = useMemo(() => shuffle(optionsFor(card)), [card.id]);

  function handleSelect(option) {
    if (revealed) return;
    setSelected(option);
    setRevealed(true);
    const isCorrect = option === card.answer;
    if (isCorrect) {
      const next = correctCount + 1;
      setCorrectCount(next);
      correctRef.current = next;
    } else {
      const next = [...wrongIds, card.id];
      setWrongIds(next);
      wrongRef.current = next;
    }
  }

  function handleNext() {
    if (index + 1 < cards.length) {
      setIndex((i) => i + 1);
      setSelected(null);
      setRevealed(false);
    } else {
      // Use refs to guarantee the final answer is always included,
      // regardless of React's state-batching timing.
      onFinish({
        correctCount: correctRef.current,
        total: cards.length,
        wrongIds: wrongRef.current,
      });
    }
  }

  useEffect(() => {
    function handleKeyDown(e) {
      if (revealed && e.key === "Enter") {
        e.preventDefault();
        handleNext();
        return;
      }
      if (!revealed) {
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= options.length) {
          e.preventDefault();
          handleSelect(options[num - 1]);
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [revealed, options, handleSelect, handleNext]);

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto">
      <p className="font-sans text-xs text-slate-500 dark:text-slate-400 tracking-widest">
        QUESTION {index + 1} / {cards.length} · SCORE {correctCount}
      </p>

      <div className="w-full rounded-xl border-2 border-rule bg-paper-card p-6">
        <p className="font-display text-lg text-ink mb-5 text-center">{card.question}</p>
        <div className="flex flex-col gap-3">
          {options.map((opt, idx) => {
            const isSelected = selected === opt;
            const isCorrectOption = opt === card.answer;
            let stateClasses = "border-rule hover:border-ink";
            if (revealed && isCorrectOption) {
              stateClasses = "border-correct bg-correct/10";
            } else if (revealed && isSelected && !isCorrectOption) {
              stateClasses = "border-wrong bg-wrong/10";
            }
            return (
              <button
                key={opt}
                onClick={() => handleSelect(opt)}
                disabled={revealed}
                className={`text-left rounded-md border-2 px-4 py-3 font-body text-sm text-ink flex justify-between items-center group
                            transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink disabled:cursor-default ${stateClasses}`}
              >
                <span>{opt}</span>
                {!revealed && (
                  <span className="opacity-0 group-hover:opacity-40 transition-opacity text-[10px] px-1.5 py-0.5 border-2 rounded-sm border-rule font-bold hidden sm:block">
                    {idx + 1}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {revealed && (
        <button
          onClick={handleNext}
          className="rounded-md bg-ink px-5 py-2 font-sans text-sm font-bold text-paper-card
                     transition-all hover:-translate-y-0.5 hover:opacity-90 active:translate-y-0 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ink dark:focus-visible:ring-offset-[#12141A]"
        >
          {index + 1 < cards.length ? "Next question →" : "See results"}
        </button>
      )}
    </div>
  );
}
