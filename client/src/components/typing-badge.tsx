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
  typingSpeedMs = 26,
  deletingSpeedMs = 20,
  pauseMs = 900,
  className = "",
}: TypingBadgeProps) {
  const safePhrases = useMemo(() => (phrases.length ? phrases : [""]), [phrases]);
  const [index, setIndex] = useState(0);
  const [length, setLength] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const timer = useRef<number | null>(null);
  const reduced = useRef<boolean>(false);

  useEffect(() => {
    // Respect user's reduced motion preference
    try {
      reduced.current = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {}
  }, []);

  const jitter = (base: number, spread = 14) => base + Math.round(Math.random() * spread);

  useEffect(() => {
    const current = safePhrases[index % safePhrases.length];
    const doneTyping = length === current.length;
    const doneDeleting = deleting && length === 0;

    if (timer.current) window.clearTimeout(timer.current);

    if (reduced.current) {
      // No typing animation: just cycle phrases
      if (!doneTyping) setLength(current.length);
      else timer.current = window.setTimeout(() => {
        setIndex((i) => (i + 1) % safePhrases.length);
        setLength(0);
      }, 1600);
      return () => {
        if (timer.current) window.clearTimeout(timer.current);
      };
    }

    if (!deleting && !doneTyping) {
      timer.current = window.setTimeout(() => setLength((l) => l + 1), jitter(typingSpeedMs));
    } else if (!deleting && doneTyping) {
      timer.current = window.setTimeout(() => setDeleting(true), pauseMs);
    } else if (deleting && !doneDeleting) {
      timer.current = window.setTimeout(() => setLength((l) => Math.max(0, l - 1)), jitter(deletingSpeedMs, 10));
    } else if (doneDeleting) {
      setDeleting(false);
      setIndex((i) => (i + 1) % safePhrases.length);
    }

    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [deleting, length, index, safePhrases, typingSpeedMs, deletingSpeedMs, pauseMs]);

  const full = safePhrases[index % safePhrases.length];
  const visible = full.slice(0, length);
  const rest = visible.slice(0, -1);
  const last = visible.slice(-1);

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card/60 backdrop-blur text-xs text-muted-foreground ${className}`}>
      <i className="fas fa-magic text-primary" />
      <span className="whitespace-nowrap">
        {rest}
        {last && <span className="type-fade">{last}</span>}
        <span className="inline-block align-baseline ml-1 w-[2px] h-[1.1em] bg-current/80 caret-blink rounded-sm" />
      </span>
    </div>
  );
}
