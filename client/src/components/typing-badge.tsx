import { useEffect, useMemo, useRef, useState } from "react";

type TypingBadgeProps = {
  phrases: string[];
  typingSpeedMs?: number;
  deletingSpeedMs?: number;
  pauseMs?: number;
  className?: string;
};

export default function TypingBadge({
  phrases,
  typingSpeedMs = 45,
  deletingSpeedMs = 28,
  pauseMs = 1100,
  className = "",
}: TypingBadgeProps) {
  const safePhrases = useMemo(() => (phrases.length ? phrases : [""]), [phrases]);
  const [index, setIndex] = useState(0);
  const [length, setLength] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const current = safePhrases[index % safePhrases.length];
    const doneTyping = length === current.length;
    const doneDeleting = deleting && length === 0;

    if (timer.current) window.clearTimeout(timer.current);

    if (!deleting && !doneTyping) {
      timer.current = window.setTimeout(() => setLength((l) => l + 1), typingSpeedMs);
    } else if (!deleting && doneTyping) {
      timer.current = window.setTimeout(() => setDeleting(true), pauseMs);
    } else if (deleting && !doneDeleting) {
      timer.current = window.setTimeout(() => setLength((l) => Math.max(0, l - 1)), deletingSpeedMs);
    } else if (doneDeleting) {
      setDeleting(false);
      setIndex((i) => (i + 1) % safePhrases.length);
    }

    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [deleting, length, index, safePhrases, typingSpeedMs, deletingSpeedMs, pauseMs]);

  const text = safePhrases[index % safePhrases.length].slice(0, length);

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card/60 backdrop-blur text-xs text-muted-foreground ${className}`}>
      <i className="fas fa-magic text-primary" />
      <span className="whitespace-nowrap">
        {text}
        <span className="inline-block align-baseline ml-1 w-[2px] h-[1.1em] bg-current/80 animate-pulse rounded-sm" />
      </span>
    </div>
  );
}

