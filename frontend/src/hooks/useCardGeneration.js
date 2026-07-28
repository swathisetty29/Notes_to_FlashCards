import { useCallback, useEffect, useRef, useState } from "react";
import { fetchCardSet, refineCardSet } from "../services/api";

/** Safely read and parse JSON from localStorage. Returns fallback on any error. */
function safeParse(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    localStorage.removeItem(key); // clear corrupted entry
    return fallback;
  }
}

/**
 * status: 'idle' | 'loading' | 'error' | 'ready'
 *
 * Stale-response protection: every call to generate() gets a unique
 * requestId. If a response comes back whose requestId no longer matches
 * the latest one issued (because the user clicked Generate again before
 * the first request finished), it's discarded instead of overwriting
 * fresher state. We also abort the in-flight request via AbortController
 * so we're not just discarding the result, we're canceling the network
 * call itself.
 */
export function useCardGeneration() {
  const [status, setStatus] = useState(() => {
    const saved = localStorage.getItem("studyState_status");
    // Don't restore loading or error states
    return saved === "ready" ? "ready" : "idle";
  });
  const [cards, setCards] = useState(() => {
    return safeParse("studyState_cards", null);
  });
  const [topic, setTopic] = useState(() => {
    return localStorage.getItem("studyState_topic") || null;
  });
  const [error, setError] = useState(null);

  const latestRequestId = useRef(0);
  const abortRef = useRef(null);
  const lastTextRef = useRef("");
  const lastRefineRef = useRef(null); // stores last refine instruction for retry

  useEffect(() => {
    if (status === "ready") {
      localStorage.setItem("studyState_status", status);
    } else if (status === "idle") {
      localStorage.removeItem("studyState_status");
    }
  }, [status]);

  useEffect(() => {
    if (cards) localStorage.setItem("studyState_cards", JSON.stringify(cards));
    else localStorage.removeItem("studyState_cards");
  }, [cards]);

  useEffect(() => {
    if (topic) localStorage.setItem("studyState_topic", topic);
    else localStorage.removeItem("studyState_topic");
  }, [topic]);

  const generate = useCallback(async (text) => {
    lastTextRef.current = text;
    lastRefineRef.current = null; // mark this as a generate, not a refine

    // Cancel any in-flight request before starting a new one.
    if (abortRef.current) {
      abortRef.current.abort();
    }

    const requestId = ++latestRequestId.current;
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus("loading");
    setError(null);

    try {
      const data = await fetchCardSet(text, controller.signal);

      // Ignore if a newer request has since been issued.
      if (requestId !== latestRequestId.current) return;

      setCards(data.cards);
      setTopic(data.topic);
      setStatus("ready");
      
      // Clear old quiz state so the new deck starts fresh
      localStorage.removeItem("studyState_quiz_mode");
      localStorage.removeItem("studyState_quiz_cards");
      localStorage.removeItem("studyState_quiz_result");
    } catch (err) {
      if (err.code === "CANCELED") return; // superseded, ignore silently
      if (requestId !== latestRequestId.current) return;

      setError(err);
      setStatus("error");
    }
  }, []);

  const reset = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    latestRequestId.current += 1;
    setStatus("idle");
    setCards(null);
    setTopic(null);
    setError(null);
    
    // Do not clear the entire session on "Start a new set", just the generation state.
    // However, since "Start a new set" puts us in idle, it effectively resets things.
    // The instructions said "add a Clear session button", so we will provide a separate clearSession.
  }, []);

  const clearSession = useCallback(() => {
    reset();
    localStorage.removeItem("studyState_status");
    localStorage.removeItem("studyState_cards");
    localStorage.removeItem("studyState_topic");
    localStorage.removeItem("studyState_quiz");
  }, [reset]);

  const refine = useCallback(async (instruction) => {
    if (!cards || !topic) return;

    lastRefineRef.current = instruction; // remember for retry

    if (abortRef.current) {
      abortRef.current.abort();
    }

    const requestId = ++latestRequestId.current;
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus("loading");
    setError(null);

    try {
      const data = await refineCardSet({ topic, cards }, instruction, controller.signal);

      if (requestId !== latestRequestId.current) return;

      setCards(data.cards);
      setTopic(data.topic);
      setStatus("ready");

      // Clear old quiz state so the refined deck starts fresh
      localStorage.removeItem("studyState_quiz_mode");
      localStorage.removeItem("studyState_quiz_cards");
      localStorage.removeItem("studyState_quiz_result");
    } catch (err) {
      if (err.code === "CANCELED") return; 
      if (requestId !== latestRequestId.current) return;

      setError(err);
      setStatus("error");
    }
  }, [cards, topic]);

  // retry correctly re-attempts either generate or refine depending on
  // which operation last failed.
  const retry = useCallback(() => {
    if (lastRefineRef.current) {
      refine(lastRefineRef.current);
    } else if (lastTextRef.current) {
      generate(lastTextRef.current);
    }
  }, [generate, refine]);

  const [savedDecks, setSavedDecks] = useState(() => {
    return safeParse("studyState_saved_decks", []);
  });

  useEffect(() => {
    localStorage.setItem("studyState_saved_decks", JSON.stringify(savedDecks));
  }, [savedDecks]);

  const saveDeck = useCallback(() => {
    if (!cards || !topic) return;
    
    // Get the current quiz state from localStorage so it saves along with the deck
    const quizMode = localStorage.getItem("studyState_quiz_mode") || "flashcards";

    const newDeck = {
      id: Date.now().toString(),
      topic,
      cards,
      quizData: {
        mode: quizMode,
        quizCards: safeParse("studyState_quiz_cards", null),
        quizResult: safeParse("studyState_quiz_result", null),
      }
    };
    setSavedDecks(prev => [...prev, newDeck]);
  }, [cards, topic]);

  const deleteDeck = useCallback((id) => {
    setSavedDecks(prev => prev.filter(d => d.id !== id));
  }, []);

  const loadDeck = useCallback((deck) => {
    // Restore the session state
    setCards(deck.cards);
    setTopic(deck.topic);
    setStatus("ready");
    setError(null);

    // Restore the quiz state
    if (deck.quizData) {
      localStorage.setItem("studyState_quiz_mode", deck.quizData.mode || "flashcards");
      if (deck.quizData.quizCards) {
        localStorage.setItem("studyState_quiz_cards", JSON.stringify(deck.quizData.quizCards));
      } else {
        localStorage.removeItem("studyState_quiz_cards");
      }
      if (deck.quizData.quizResult) {
        localStorage.setItem("studyState_quiz_result", JSON.stringify(deck.quizData.quizResult));
      } else {
        localStorage.removeItem("studyState_quiz_result");
      }
    } else {
      localStorage.removeItem("studyState_quiz_mode");
      localStorage.removeItem("studyState_quiz_cards");
      localStorage.removeItem("studyState_quiz_result");
    }
  }, []);

  return { 
    status, cards, topic, error, generate, refine, reset, clearSession, retry,
    savedDecks, saveDeck, deleteDeck, loadDeck 
  };
}
