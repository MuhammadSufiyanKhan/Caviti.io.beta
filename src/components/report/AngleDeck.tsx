"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CopyButton } from "@/components/report/CopyButton";
import type { AdAngle } from "@/lib/report-data";

const short = (name: string) => (name.length > 30 ? `${name.slice(0, 28)}…` : name);

/** Flip through ad angles one at a time instead of scrolling a wall of cards. */
export function AngleDeck({ angles }: { angles: AdAngle[] }) {
  const [index, setIndex] = useState(0);
  if (angles.length === 0) return null;
  const angle = angles[Math.min(index, angles.length - 1)];

  const fields: [string, string][] = [
    ["The pain", angle.customerPain],
    ["The hidden frustration", angle.hiddenFrustration],
    ["The gap", angle.marketGap],
    ["Why it works", angle.whyItWorks],
  ];

  return (
    <div>
      <div role="tablist" aria-label="Ad angles" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {angles.map((a, i) => (
          <button
            key={`${a.name}-${i}`}
            role="tab"
            aria-selected={i === index}
            title={a.name}
            onClick={() => setIndex(i)}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              i === index
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted hover:text-foreground"
            }`}
          >
            {short(a.name)}
          </button>
        ))}
      </div>

      <motion.div
        key={index}
        role="tabpanel"
        initial={{ opacity: 0, x: 18 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="mt-5 rounded-3xl border border-border bg-surface p-6 sm:p-8"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h3 className="display max-w-2xl text-3xl leading-tight sm:text-4xl">{angle.name}</h3>
          <CopyButton
            label="Copy angle"
            getText={() => `${angle.name}\n${fields.map(([l, t]) => `${l}: ${t}`).join("\n")}`}
          />
        </div>
        <dl className="mt-6 grid gap-x-10 gap-y-6 sm:grid-cols-2">
          {fields.map(([label, text]) => (
            <div key={label} className="border-t border-border pt-3">
              <dt className="text-sm font-semibold">{label}</dt>
              <dd className="mt-1.5 leading-relaxed text-muted">{text}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-6 flex items-center justify-between text-sm text-muted">
          <span>
            Angle {index + 1} of {angles.length}
          </span>
          <span className="flex gap-2">
            <button
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
              aria-label="Previous angle"
              className="rounded-full border border-border p-2 hover:text-foreground disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIndex((i) => Math.min(angles.length - 1, i + 1))}
              disabled={index === angles.length - 1}
              aria-label="Next angle"
              className="rounded-full border border-border p-2 hover:text-foreground disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </span>
        </div>
      </motion.div>
    </div>
  );
}
