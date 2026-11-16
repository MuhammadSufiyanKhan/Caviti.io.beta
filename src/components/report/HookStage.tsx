"use client";

import { useState } from "react";
import { RotateCw } from "lucide-react";
import { CopyButton } from "@/components/report/CopyButton";
import { scrollToId } from "@/lib/smooth-scroll";
import type { Hook } from "@/lib/report-data";

/** Text size that fits the hook inside the phone, from short punchy lines to long generated ones. */
function captionSize(wordCount: number) {
  if (wordCount <= 8) return "1.7rem";
  if (wordCount <= 16) return "1.4rem";
  if (wordCount <= 28) return "1.15rem";
  if (wordCount <= 45) return "0.98rem";
  return "0.85rem";
}

/** Hooks played on a phone-shaped stage with the three-second clock running, with a picker beside it. */
export function HookStage({ hooks }: { hooks: Hook[] }) {
  const [index, setIndex] = useState(0);
  const [play, setPlay] = useState(0);
  if (hooks.length === 0) return null;
  const hook = hooks[Math.min(index, hooks.length - 1)];
  const words = hook.hook.split(/\s+/).filter(Boolean);
  // Long hooks speed up so the whole line still lands inside three seconds.
  const step = Math.min(0.16, 2.2 / Math.max(1, words.length));

  const choose = (i: number) => {
    setIndex(i);
    setPlay((p) => p + 1);
    // On wide screens the phone follows you down the list. On a phone it can't, so bring it into view.
    if (window.matchMedia("(max-width: 767px)").matches) scrollToId("hook-phone", -90);
  };

  return (
    <div className="grid items-start gap-8 md:grid-cols-[270px_minmax(0,1fr)] md:gap-12">
      <div id="hook-phone" className="md:sticky md:top-28 md:self-start">
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
          <div className="absolute inset-0 flex flex-col px-5 pb-4 pt-9">
            <p className="line-clamp-3 shrink-0 text-xs leading-snug text-on-accent/70">
              {hook.visualDirection ? (
                <>
                  <span className="font-semibold text-on-accent">On screen: </span>
                  {hook.visualDirection}
                </>
              ) : (
                "First three seconds"
              )}
            </p>
            <div data-lenis-prevent className="mt-auto min-h-0 overflow-y-auto pt-3">
              <p
                key={`words-${index}-${play}`}
                className="display leading-[1.06]"
                style={{ fontSize: captionSize(words.length), "--step": `${step}s` } as React.CSSProperties}
              >
                {words.map((word, i) => (
                  <span key={i} className="hook-word" style={{ "--i": i } as React.CSSProperties}>
                    {word}
                    {"\u00a0"}
                  </span>
                ))}
              </p>
            </div>
            <span className="mt-3 shrink-0 text-xs tabular-nums text-on-accent/70">0:00 to 0:03</span>
          </div>
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
                  <span
                    className={`display mt-0.5 block text-[1.2rem] leading-[1.14] sm:text-[1.35rem] ${on ? "" : "line-clamp-3"}`}
                  >
                    “{h.hook}”
                  </span>
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
