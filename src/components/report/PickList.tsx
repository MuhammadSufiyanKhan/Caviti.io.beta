"use client";

import { Check, Plus } from "lucide-react";
import { Inline } from "@/components/report/Inline";

export type PlanKind = "gap" | "strategy";

interface PickListProps {
  items: string[];
  kind: PlanKind;
  isPicked: (kind: PlanKind, text: string) => boolean;
  onToggle: (kind: PlanKind, text: string) => void;
}

/** Findings you can add to your own plan with one click. */
export function PickList({ items, kind, isPicked, onToggle }: PickListProps) {
  return (
    <ul className="border-b border-border">
      {items.map((item) => {
        const picked = isPicked(kind, item);
        return (
          <li
            key={item}
            className={`flex items-start gap-4 border-t border-border py-4 transition-colors sm:px-3 ${
              picked ? "bg-accent-muted/60" : ""
            }`}
          >
            <p className="min-w-0 flex-1 text-lg leading-relaxed">
              <Inline text={item} />
            </p>
            <button
              type="button"
              aria-pressed={picked}
              onClick={() => onToggle(kind, item)}
              className={`mt-0.5 inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                picked
                  ? "border-accent bg-accent text-on-accent"
                  : "border-border text-muted hover:border-foreground/40 hover:text-foreground"
              }`}
            >
              {picked ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              <span className="max-sm:sr-only">{picked ? "In your plan" : "Add to plan"}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
