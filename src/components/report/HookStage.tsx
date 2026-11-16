"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Heart, MessageCircle, RotateCw, Share2 } from "lucide-react";
import { CopyButton } from "@/components/report/CopyButton";
import { scrollToId } from "@/lib/smooth-scroll";
import type { Hook } from "@/lib/report-data";

/** People read about three words a second; an ad opener has roughly three seconds to land. */
const WORDS_PER_SECOND = 3;
const TARGET_SECONDS = 3;

const readSeconds = (words: number) => Math.max(1, Math.round(words / WORDS_PER_SECOND));

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia("(prefers-reduced-motion: reduce)");
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  );
}

/** Splits a hook into short caption phrases, breaking at punctuation where it can. */
function toChunks(words: string[]): string[][] {
  const chunks: string[][] = [];
  let current: string[] = [];
  for (const word of words) {
    current.push(word);
    const atBreak = /[.,;:!?]["”']?$/.test(word);
    if ((atBreak && current.length >= 3) || current.length >= 7) {
      chunks.push(current);
      current = [];
    }
  }
  if (current.length) {
    if (chunks.length && current.length < 3) chunks[chunks.length - 1].push(...current);
    else chunks.push(current);
  }
  return chunks;
}

const captionSize = (text: string) => (text.length <= 22 ? "2.1rem" : text.length <= 38 ? "1.75rem" : "1.5rem");

/** The phone screen. Remounted (via `key`) to replay from the start. */
function PhoneScreen({ hook }: { hook: Hook }) {
  const reduced = usePrefersReducedMotion();
  const words = useMemo(() => hook.hook.split(/\s+/).filter(Boolean), [hook.hook]);
  const chunks = useMemo(() => toChunks(words), [words]);
  const total = Math.min(40, Math.max(TARGET_SECONDS, words.length / WORDS_PER_SECOND));
  const durations = useMemo(
    () => chunks.map((c) => Math.max(0.9, (total * c.length) / Math.max(1, words.length))),
    [chunks, total, words.length]
  );
  const [chunk, setChunk] = useState(0);

  useEffect(() => {
    if (reduced) return;
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    const next = () => {
      timer = setTimeout(() => {
        if (i < chunks.length - 1) {
          i += 1;
          setChunk(i);
          next();
        }
      }, durations[i] * 1000);
    };
    next();
    return () => clearTimeout(timer);
  }, [reduced, chunks, durations]);

  const shown = reduced ? words : (chunks[Math.min(chunk, chunks.length - 1)] ?? words);
  const text = shown.join(" ");

  return (
    <div
      className="absolute inset-0 overflow-hidden text-white"
      style={{
        background:
          "radial-gradient(120% 70% at 20% 0%, color-mix(in oklab, var(--accent) 55%, transparent), transparent 60%), linear-gradient(170deg, color-mix(in oklab, var(--accent) 62%, #000), color-mix(in oklab, var(--accent) 22%, #000))",
      }}
    >
      {/* Story progress */}
      {!reduced && (
        <span className="absolute inset-x-4 top-11 z-10 h-[3px] overflow-hidden rounded-full bg-white/25">
          <span
            className="block h-full origin-left rounded-full bg-white"
            style={{ animation: `seg-fill ${total}s linear forwards` }}
          />
        </span>
      )}

      {/* Account row */}
      <div className="absolute inset-x-4 top-[3.35rem] z-10 flex items-center gap-2 pt-1.5">
        <span className="h-7 w-7 rounded-full bg-white/90" aria-hidden />
        <span className="text-[13px] font-semibold leading-none">yourbrand</span>
        <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] leading-none">Sponsored</span>
      </div>

      {/* Scene note */}
      {hook.visualDirection && (
        <p className="absolute inset-x-4 top-[6.3rem] z-10 line-clamp-3 rounded-xl bg-black/25 px-3 py-2 text-[11px] leading-snug backdrop-blur-sm">
          <span className="font-semibold">On screen: </span>
          {hook.visualDirection}
        </p>
      )}

      {/* Captions */}
      <div className="absolute inset-x-5 bottom-24 top-[11rem] flex items-center justify-center">
        <p
          key={reduced ? "all" : chunk}
          className="display text-center leading-[1.04] [text-shadow:0_2px_18px_rgba(0,0,0,0.45)]"
          style={{ fontSize: captionSize(text), "--step": "0.07s" } as React.CSSProperties}
        >
          {shown.map((word, i) => (
            <span key={i} className="hook-word" style={{ "--i": i } as React.CSSProperties}>
              {word}
              {" "}
            </span>
          ))}
        </p>
      </div>

      {/* Reaction rail */}
      <div aria-hidden className="absolute bottom-8 right-3 z-10 flex flex-col items-center gap-4 text-white/85">
        <Heart className="h-6 w-6" />
        <MessageCircle className="h-6 w-6" />
        <Share2 className="h-6 w-6" />
      </div>

      {/* Caption count */}
      <p className="absolute bottom-6 left-5 z-10 text-[11px] tabular-nums text-white/75">
        {reduced ? "Full hook" : `Line ${Math.min(chunk + 1, chunks.length)} of ${chunks.length}`}
      </p>
    </div>
  );
}

/** How long a hook takes to read, against the three seconds an ad opener really has. */
function LengthMeter({ words }: { words: number }) {
  const seconds = words / WORDS_PER_SECOND;
  const fits = seconds <= TARGET_SECONDS + 0.5;
  const pct = Math.min(100, (seconds / (TARGET_SECONDS * 2)) * 100);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4 text-sm">
        <span className="font-semibold">Reading time</span>
        <span className={`tabular-nums ${fits ? "text-accent-ink" : "text-cavity"}`}>
          about {readSeconds(words)} {readSeconds(words) === 1 ? "second" : "seconds"}, {words} words
        </span>
      </div>
      <div className="relative mt-2.5 h-2 rounded-full bg-border">
        <span
          className={`block h-full rounded-full transition-[width] duration-500 ${fits ? "bg-accent" : "bg-cavity"}`}
          style={{ width: `${pct}%` }}
        />
        <span
          aria-hidden
          className="absolute -top-1 h-4 w-0.5 rounded bg-foreground/60"
          style={{ left: "50%" }}
          title="3 seconds"
        />
      </div>
      <p className="mt-2 text-sm text-muted">
        {fits
          ? "Short enough to land in the first three seconds."
          : "Runs long for an opener. Ads work best when the hook lands in about three seconds."}
      </p>
    </div>
  );
}

/** Hooks played as a short-video ad on a phone, with a picker and a reading-time check beside it. */
export function HookStage({ hooks }: { hooks: Hook[] }) {
  const [index, setIndex] = useState(0);
  const [play, setPlay] = useState(0);
  if (hooks.length === 0) return null;
  const current = Math.min(index, hooks.length - 1);
  const hook = hooks[current];
  const wordCount = hook.hook.split(/\s+/).filter(Boolean).length;

  const choose = (i: number) => {
    setIndex(i);
    setPlay((p) => p + 1);
    // On wide screens the phone follows you down the list. On a phone it can't, so bring it into view.
    if (window.matchMedia("(max-width: 767px)").matches) scrollToId("hook-phone", -90);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    choose(e.key === "ArrowDown" ? Math.min(hooks.length - 1, current + 1) : Math.max(0, current - 1));
  };

  return (
    <div className="grid items-start gap-8 md:grid-cols-[290px_minmax(0,1fr)] md:gap-12">
      <div id="hook-phone" className="md:sticky md:top-28 md:self-start">
        {/* Device */}
        <div
          className="relative mx-auto aspect-[9/19] w-full max-w-[290px] rounded-[2.8rem] bg-[#0d0d10] p-[9px] shadow-2xl ring-2 ring-foreground/20 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5),0_0_70px_-12px_var(--glow)] md:mx-0"
          role="img"
          aria-label={`Preview of the hook: ${hook.hook}`}
        >
          <span aria-hidden className="absolute -left-[3px] top-28 h-12 w-[3px] rounded-l bg-foreground/25" />
          <span aria-hidden className="absolute -right-[3px] top-36 h-16 w-[3px] rounded-r bg-foreground/25" />
          <div className="relative h-full w-full overflow-hidden rounded-[2.2rem]">
            <PhoneScreen key={`${current}-${play}`} hook={hook} />
            {/* Status bar and island */}
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between px-6 pt-2.5 text-[11px] font-semibold text-white">
              <span>9:41</span>
              <span className="absolute left-1/2 top-2 h-[22px] w-[74px] -translate-x-1/2 rounded-full bg-black" />
              <span className="flex items-center gap-1 pt-px">
                <span className="flex items-end gap-[2px]">
                  {[4, 6, 8, 10].map((h) => (
                    <span key={h} className="w-[3px] rounded-sm bg-white" style={{ height: h }} />
                  ))}
                </span>
                <span className="relative ml-1 h-[10px] w-[20px] rounded-[3px] border border-white/80 p-[1.5px]">
                  <span className="block h-full w-3/4 rounded-[1px] bg-white" />
                </span>
              </span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setPlay((p) => p + 1)}
          className="mx-auto mt-5 flex items-center gap-2 text-sm font-medium text-accent-ink hover:underline md:mx-0"
        >
          <RotateCw className="h-4 w-4" aria-hidden /> Replay
        </button>
      </div>

      <div>
        <ul className="space-y-2" aria-label="Hooks" onKeyDown={onKeyDown}>
          {hooks.map((h, i) => {
            const on = i === current;
            const n = h.hook.split(/\s+/).filter(Boolean).length;
            const short = n / WORDS_PER_SECOND <= TARGET_SECONDS + 0.5;
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
                  <span className="flex flex-wrap items-center gap-2 text-xs">
                    {h.hookType && <span className={`font-medium ${on ? "text-accent-ink" : "text-muted"}`}>{h.hookType}</span>}
                    <span
                      className={`rounded-full px-2 py-0.5 font-medium ${
                        short ? "bg-accent-muted text-accent-ink" : "bg-cavity-muted text-cavity"
                      }`}
                    >
                      {n} words
                    </span>
                  </span>
                  <span
                    className={`display mt-1 block text-[1.2rem] leading-[1.14] sm:text-[1.35rem] ${on ? "" : "line-clamp-3"}`}
                  >
                    “{h.hook}”
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 space-y-5 rounded-2xl border border-border p-5">
          <LengthMeter words={wordCount} />
          {hook.customerPainUsed && (
            <p className="border-t border-border pt-4 text-sm leading-relaxed">
              <span className="font-semibold">Pain it speaks to: </span>
              <span className="text-muted">{hook.customerPainUsed}</span>
            </p>
          )}
          <CopyButton label="Copy this hook" getText={() => hook.hook} />
        </div>
      </div>
    </div>
  );
}
