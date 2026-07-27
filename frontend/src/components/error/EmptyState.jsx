export default function EmptyState() {
  return (
    <div className="rounded-lg border-2 border-dashed border-rule px-6 py-12 text-center">
      <p className="font-display text-lg text-ink mb-1">No flashcards yet</p>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Paste some notes or name a topic above, then generate a set of cards to study.
      </p>
    </div>
  );
}

