"use client";

import { Check, Plus } from "lucide-react";
import { Inline } from "@/components/report/Inline";
import { Reveal } from "@/components/site/Reveal";
import type { PlanKind } from "@/components/report/PickList";

interface GapBoardProps {
  items: string[];
  isPicked: (kind: PlanKind, text: string) => boolean;
  onToggle: (kind: PlanKind, text: string) => void;
}

/** A hollow cavity that fills in when you take the gap on. */
function CavityGlyph({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12 shrink-0" aria-hidden>
      <circle
        cx="24"
        cy="24"
        r="21"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="3 5"
        className={`transition-colors duration-500 ${filled ? "text-accent" : "text-cavity"}`}
      />
      <circle
        cx="24"
        cy="24"
        r="12"
        className={`transition-transform duration-500 ease-out ${filled ? "scale-100 fill-accent" : "scale-[0.4] fill-cavity"}`}
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
      />
      <path
        d="M18 24.5l4.5 4.5 8-9"
        fill="none"
        stroke="var(--on-accent)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`transition-opacity duration-300 ${filled ? "opacity-100 delay-200" : "opacity-0"}`}
      />
    </svg>
  );
}

/** Market gaps as a board of cards. Tap one to fill it, and it joins your plan. */
export function GapBoard({ items, isPicked, onToggle }: GapBoardProps) {
  return (
    <Reveal as="ul" stagger y={34} className="grid gap-4 md:grid-cols-2">
      {items.map((item, i) => {
        const picked = isPicked("gap", item);
        const lead = i === 0;
        return (
          <li key={item} className={lead ? "md:col-span-2" : ""}>
            <div
              onPointerMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                e.currentTarget.style.setProperty("--x", `${e.clientX - rect.left}px`);
                e.currentTarget.style.setProperty("--y", `${e.clientY - rect.top}px`);
              }}
              className={`spot flex h-full flex-col justify-between gap-8 rounded-3xl border p-6 transition-colors duration-300 sm:p-8 ${
                lead ? "min-h-[240px]" : "min-h-[220px]"
              } ${picked ? "border-accent bg-accent-muted/70" : "border-border bg-surface/80 hover:border-foreground/30"}`}
            >
              <div className="flex items-start justify-between gap-4">
                <CavityGlyph filled={picked} />
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    picked ? "bg-accent text-on-accent" : "bg-cavity-muted text-cavity"
                  }`}
                >
                  {picked ? "Filled" : "Open gap"}
                </span>
              </div>
              <p
                className={`display max-w-3xl leading-[1.1] ${
                  lead ? "text-[clamp(1.9rem,3.6vw,2.9rem)]" : "text-[clamp(1.5rem,2.6vw,2rem)]"
                }`}
              >
                <Inline text={item} />
              </p>
              <button
                type="button"
                aria-pressed={picked}
                onClick={() => onToggle("gap", item)}
                className={`inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  picked
                    ? "border-accent bg-accent text-on-accent"
                    : "border-foreground/25 hover:border-foreground hover:bg-foreground hover:text-background"
                }`}
              >
                {picked ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {picked ? "In your plan" : "Fill this gap"}
              </button>
            </div>
          </li>
        );
      })}
    </Reveal>
  );
}
