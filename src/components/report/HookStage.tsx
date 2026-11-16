"use client";

import { useState } from "react";
import { RotateCw } from "lucide-react";
import { CopyButton } from "@/components/report/CopyButton";
import type { Hook } from "@/lib/report-data";

/** Hooks played on a phone-shaped stage with the three-second clock running, with a picker beside it. */
export function HookStage({ hooks }: { hooks: Hook[] }) {
  const [index, setIndex] = useState(0);
  const [play, setPlay] = useState(0);
  if (hooks.length === 0) return null;
  const hook = hooks[Math.min(index, hooks.length - 1)];
  const words = hook.hook.split(/\s+/).filter(Boolean);

  const choose = (i: number) => {
    setIndex(i);
    setPlay((p) => p + 1);
  };

  return (
    <div className="grid items-start gap-8 md:grid-cols-[270px_minmax(0,1fr)] md:gap-12">
      <div>
        <div
          role="img"
          aria-label={`Preview of the hook: ${hook.hook}`}
          className="relative mx-auto aspect-[9/16] w-full max-w-[270px] overflow-hidden rounded-[2.4rem] border-[7px] border-foreground bg-accent text-on-accent shadow-2xl md:mx-0"
        >
          <span className="absolute left-3 right-3 top-3 z-10 h-1 overflow-hidden rounded-full bg-on-accent/25">
            <span
              key={`bar-${index}-${play}`}
              className="block h-full origin-left rounded-full bg-on-accent"
              style={{ animation: "seg-fill 3s linear forwards" }}
            />
          </span>
          <div className="absolute inset-x-5 top-9 text-xs leading-snug text-on-accent/70">
            {hook.visualDirection ? (
              <>
                <span className="font-semibold text-on-accent">On screen: </span>
                {hook.visualDirection}
              </>
            ) : (
              "First three seconds"
            )}
          </div>
          <p
            key={`words-${index}-${play}`}
            className="display absolute inset-x-5 bottom-14 text-[1.7rem] leading-[1.05]"
          >
            {words.map((word, i) => (
              <span key={i} className="hook-word" style={{ "--i": i } as React.CSSProperties}>
                {word}
                {" "}
              </span>
            ))}
          </p>
          <span className="absolute bottom-5 left-5 text-xs tabular-nums text-on-accent/70">0:00 to 0:03</span>
        </div>
        <button
          type="button"
          onClick={() => setPlay((p) => p + 1)}
          className="mx-auto mt-4 flex items-center gap-2 text-sm font-medium text-accent-ink hover:underline md:mx-0"
        >
          <RotateCw className="h-4 w-4" aria-hidden /> Replay the three seconds
        </button>
      </div>

      <div>
        <ul className="space-y-2" aria-label="Hooks">
          {hooks.map((h, i) => {
            const on = i === index;
            return (
              <li key={i}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => choose(i)}
                  className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                    on ? "border-accent bg-accent-muted/70" : "border-border bg-surface/60 hover:border-foreground/30"
                  }`}
                >
                  {h.hookType && (
                    <span className={`text-xs font-medium ${on ? "text-accent-ink" : "text-muted"}`}>{h.hookType}</span>
                  )}
                  <span className="display mt-0.5 block text-[1.35rem] leading-[1.12] sm:text-2xl">“{h.hook}”</span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 rounded-2xl border border-border p-5">
          {hook.customerPainUsed && (
            <p className="text-sm leading-relaxed">
              <span className="font-semibold">Pain it speaks to: </span>
              <span className="text-muted">{hook.customerPainUsed}</span>
            </p>
          )}
          <div className={hook.customerPainUsed ? "mt-4" : ""}>
            <CopyButton label="Copy this hook" getText={() => hook.hook} />
          </div>
        </div>
      </div>
    </div>
  );
}
