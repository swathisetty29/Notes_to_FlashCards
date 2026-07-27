export default function CardSkeleton() {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      role="status"
      aria-label="Generating flashcards"
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-40 rounded-lg border-2 border-rule bg-paper-card p-4 overflow-hidden relative"
        >
          <div className="h-3 w-1/3 rounded bg-rule mb-4 animate-pulse" />
          <div className="h-3 w-full rounded bg-rule mb-2 animate-pulse" />
          <div className="h-3 w-4/5 rounded bg-rule animate-pulse" />
          <div
            className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite]"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)",
            }}
          />
        </div>
      ))}
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

