"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Inline } from "@/components/report/Inline";

export interface ComplaintItem {
  id: string;
  title: string;
  mentions?: number;
  description?: string;
  quotes: string[];
}

/** Pick a complaint on the left, read the evidence on the right. Bars show how often each came up. */
export function ComplaintExplorer({ items }: { items: ComplaintItem[] }) {
  const [selected, setSelected] = useState(0);
  const [grown, setGrown] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  if (items.length === 0) return null;

  const max = Math.max(1, ...items.map((i) => i.mentions ?? 0));
  const hasCounts = items.some((i) => typeof i.mentions === "number" && i.mentions > 0);
  const current = items[Math.min(selected, items.length - 1)];

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    setSelected((s) => (e.key === "ArrowDown" ? Math.min(items.length - 1, s + 1) : Math.max(0, s - 1)));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <ul onKeyDown={onKeyDown} className="space-y-2" aria-label="Complaints">
        {items.map((item, i) => {
          const on = i === selected;
          const pct = hasCounts ? Math.max(6, Math.round(((item.mentions ?? 0) / max) * 100)) : 0;
          return (
            <li key={item.id}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => setSelected(i)}
                onMouseEnter={() => setSelected(i)}
                onFocus={() => setSelected(i)}
                className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                  on ? "border-cavity bg-cavity-muted/60" : "border-border bg-surface/60 hover:border-foreground/30"
                }`}
              >
                <span className="flex items-baseline justify-between gap-4">
                  <span className="font-semibold leading-snug">{item.title}</span>
                  {typeof item.mentions === "number" && item.mentions > 0 && (
                    <span className="shrink-0 text-sm tabular-nums text-cavity">{item.mentions}×</span>
                  )}
                </span>
                {hasCounts && (
                  <span className="mt-3 block h-1.5 overflow-hidden rounded-full bg-border">
                    <span
                      className="block h-full rounded-full bg-cavity transition-[width] duration-[900ms] ease-out"
                      style={{ width: grown ? `${pct}%` : "0%", transitionDelay: `${i * 70}ms` }}
                    />
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <motion.div
        key={current.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="rounded-3xl border border-border bg-surface p-6 sm:p-8 lg:sticky lg:top-28 lg:self-start"
        aria-live="polite"
      >
        <h3 className="display text-3xl leading-tight sm:text-4xl">{current.title}</h3>
        {typeof current.mentions === "number" && current.mentions > 0 && (
          <p className="mt-2 text-sm text-cavity">
            Came up {current.mentions} {current.mentions === 1 ? "time" : "times"}
          </p>
        )}
        {current.description && (
          <p className="mt-4 max-w-prose text-lg leading-relaxed text-muted">
            <Inline text={current.description} />
          </p>
        )}
        {current.quotes.length > 0 && (
          <div className="mt-6 space-y-3">
            {current.quotes.map((quote, q) => (
              <blockquote
                key={q}
                className="whitespace-pre-wrap border-l-2 border-cavity pl-4 text-[15px] italic leading-relaxed"
              >
                “{quote}”
              </blockquote>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
