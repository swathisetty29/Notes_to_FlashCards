# Study Assistant

Paste notes or name a topic, get an AI-generated set of flashcards, then study
them two ways: flip through as flashcards, or take a multiple-choice quiz that
lets you retest just the questions you got wrong.

## Architecture

```
React (Vite)  →  Express backend  →  Gemini API
   :5173             :5050
```

The frontend never talks to Gemini directly — the API key stays server-side.
In dev, Vite proxies `/api/*` requests to the Express server (see
`frontend/vite.config.js`).

```
study-assistant/
├── frontend/         React + Vite + Tailwind
│   └── src/
│       ├── components/
│       │   ├── input/        TopicInput (client-side validation)
│       │   ├── loading/      CardSkeleton
│       │   ├── error/        ErrorState, EmptyState
│       │   └── study/        Flashcard, FlashcardView, QuizView, QuizResults, StudySession
│       ├── hooks/
│       │   └── useCardGeneration.js   generation state, stale-response protection
│       ├── services/
│       │   └── api.js        axios wrapper, normalizes errors
│       └── utils/shuffle.js
│
└── backend/          Express + Gemini SDK
    └── src/
        ├── routes/            POST /api/generate-cards, POST /api/refine-cards
        ├── controllers/       input validation, maps outcomes to HTTP responses
        ├── services/
        │   └── geminiService.js   calls Gemini, retries once on failure
        ├── validators/
        │   └── cardSetSchema.js   Zod schema for the expected JSON shape
        ├── prompts/                system/user/retry prompt builders
        └── utils/
            ├── extractJson.js      strips markdown fences, extracts {...}
            └── mockCardSet.js      fallback data when no API key is set
```

## Setup

Requires Node 18+.

**Quick start (both servers):**
```bash
# Terminal 1 — Backend
cd backend
npm install
cp .env.example .env          # then add GEMINI_API_KEY=your_key_here
npm run dev                   # runs on http://localhost:5050

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev                   # runs on http://localhost:5173
```

Get a free Gemini API key at https://aistudio.google.com/apikey

If you don't set `GEMINI_API_KEY`, the backend still runs and serves mock
flashcard data — useful for exercising the frontend without a key.

Open `http://localhost:5173`. Requests to `/api/*` are proxied to the backend
automatically in dev.

## Features

- **Flashcard generation** — Paste notes or type a topic, get AI-generated flashcards with questions and answers
- **3D flip cards** — Click or press Space/Enter to flip cards with a smooth 3D CSS animation
- **Multiple-choice quiz** — Test yourself with shuffled options; keyboard shortcuts (1-4) for fast answering
- **Retest wrong answers** — After a quiz, retry only the questions you got wrong
- **Refine with AI** — Ask the AI to modify your cards ("make these harder", "add 3 more cards")
- **Save & load decks** — Save generated decks to localStorage and switch between them instantly
- **Dark mode** — Toggle with the header button; preference persists across sessions
- **Keyboard navigation** — Space/Enter to flip flashcards, arrow keys to navigate, 1-4 to select quiz options, Enter to advance

## AI integration & failure handling

This was the actual point of the assignment, so here's the detail:

**Getting structured output.** The system prompt forces a strict JSON shape
(topic + array of `{id, question, answer, options}`) and tells the model to
return nothing but the JSON object.

**When the model doesn't cooperate**, in order:
1. Strip markdown code fences / leading prose, extract the first `{...}` block
   (`utils/extractJson.js`).
2. `JSON.parse()` it.
3. Validate the parsed shape against a Zod schema (`validators/cardSetSchema.js`).
4. If any of the above fails — malformed JSON, wrong shape, empty response,
   timeout, or network error — retry **once** with a stricter follow-up prompt
   that tells the model what went wrong.
5. If the retry also fails, the backend returns a structured error
   (`{ error: { code, message } }`) with a `502`. It never throws an
   unhandled exception or returns a `200` with garbage data.

I deliberately didn't try to hand-repair malformed JSON (e.g. patching
trailing commas or unquoted keys). Guessing how to fix arbitrary broken JSON
is brittle and hard to reason about; retrying with a stricter prompt is
simpler, more reliable, and easier to explain.

**Defensive quiz logic:** If the AI returns quiz options that don't include the
correct answer (hallucination), the frontend detects this and forces the answer
into the options array so the quiz is always solvable.

**On the frontend**, `useCardGeneration` handles:
- `idle` / `loading` / `error` / `ready` states
- **Stale-response protection** — every call gets a `requestId`; if the user
  clicks Generate again before a request finishes, the in-flight request is
  aborted (`AbortController`) and any response tagged with an old
  `requestId` is discarded rather than overwriting newer state.
- A `retry()` that correctly retries either a generate or a refine operation
  depending on which one failed.
- **Crash-safe localStorage** — all `JSON.parse` reads are wrapped in
  `try/catch` so corrupt browser storage gracefully falls back to defaults
  instead of crashing the app.

**Client-side validation** (`TopicInput`) rejects empty or very short input
before a request is even sent, with an inline message rather than a failed
API round-trip.

**Production hardening:**
- CORS is restricted to configured origins (not open to any domain)
- In-memory rate limiter (20 requests/minute per IP) protects Gemini API quota

## AI-usage note

This project was built with the assistance of AI coding tools (Gemini, Claude).
AI was used for:
- Scaffolding the initial folder structure and config (Vite, Tailwind, Express)
- Writing the JSON extraction/validation/retry pipeline
- Drafting React components and the `useCardGeneration` hook
- Debugging API model compatibility issues
- This README

I reviewed, understood, and tested all AI-generated code before committing.
I can explain every architectural decision and extend any part of the codebase.

## Known limitations & next steps

- **Automated tests** — There is no automated test suite yet. I manually
  verified the production build, health endpoint, malformed/failed AI-response
  handling, rapid re-submits, and the final-question scoring flow. Unit tests
  for JSON extraction, schema validation, and quiz scoring would be the next
  addition given more time.
- The retry logic retries exactly once, always with the same delay (none).
  A production version would add exponential backoff for network/timeout errors.
- Quiz options for a card missing `options` fall back to a simple two-choice
  reveal rather than failing — acceptable, but not as good a quiz experience.
- Streaming responses from Gemini would improve perceived latency for
  generation.

## Time spent

- Backend (API, validation, retry logic, CORS, rate limiting): ~3h
- Frontend scaffolding + design tokens + dark mode: ~1.5h
- Core interactive UI (flashcards, quiz, retest, saved decks): ~3h
- Failure states + stale-response handling + localStorage safety: ~1h
- README + testing + polish: ~1h
