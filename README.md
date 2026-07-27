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
        ├── routes/            POST /api/generate-cards
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

**Backend**
```bash
cd backend
npm install
cp .env.example .env
# add your Gemini API key to .env (GEMINI_API_KEY=...)
# get one free at https://aistudio.google.com/apikey
npm start          # runs on http://localhost:5050
```

If you don't set `GEMINI_API_KEY`, the backend still runs and serves mock
flashcard data — useful for exercising the frontend without a key.

**Frontend**
```bash
cd frontend
npm install
npm run dev         # runs on http://localhost:5173
```

Open `http://localhost:5173`. Requests to `/api/*` are proxied to the backend
automatically in dev.

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

**On the frontend**, `useCardGeneration` handles:
- `idle` / `loading` / `error` / `ready` states
- **Stale-response protection** — every call gets a `requestId`; if the user
  clicks Generate again before a request finishes, the in-flight request is
  aborted (`AbortController`) and any response tagged with an old
  `requestId` is discarded rather than overwriting newer state.
- A `retry()` that reuses the last submitted text so the error state's
  "Try again" button doesn't need the user to retype anything.

**Client-side validation** (`TopicInput`) rejects empty or very short input
before a request is even sent, with an inline message rather than a failed
API round-trip.

## AI-usage note

This project was built collaboratively with Claude (Anthropic), used for:
- Scaffolding the folder structure and initial config (Vite, Tailwind, Express)
- Writing the JSON extraction/validation/retry pipeline
- Drafting the React components and the `useCardGeneration` hook
- This README

*(If you're using this as a submission: personalize this section with what
you actually did yourself vs. what AI helped with — the assignment explicitly
rewards honesty here, and you'll be asked to explain and extend the code live
in the interview, so make sure you understand every part of it before
submitting.)*

## Known limitations

- No automated tests (unit or e2e) — given the 8-hour budget, testing time
  went into manual verification of the failure paths instead (bad input,
  simulated timeouts, rapid double-submits).
- No session persistence yet — refreshing the page loses the current card
  set. `localStorage` save/reload was the first stretch goal if time allowed.
- The retry logic retries exactly once, always with the same delay (none).
  A production version would likely add exponential backoff for
  network/timeout errors specifically (as opposed to shape/parse errors,
  where retrying immediately with a stricter prompt makes more sense).
- Quiz options for a card missing `options` fall back to a simple two-choice
  reveal rather than failing — acceptable, but not as good a quiz experience.
- No dark mode / drag-and-drop / streaming — cut in favor of a solid core,
  per the assignment's own guidance ("a clean, solid core beats a pile of
  half-working features").

## Time spent

_Fill in actual time spent per section, e.g.:_
- Backend (API, validation, retry logic): ~2.5h
- Frontend scaffolding + design tokens: ~1h
- Core interactive UI (flashcards, quiz, retest): ~2.5h
- Failure states + stale-response handling: ~1h
- README + testing: ~1h
