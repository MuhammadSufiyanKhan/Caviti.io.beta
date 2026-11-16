"use client";

import { Layers, Lightbulb, Megaphone, MessageSquareWarning, type LucideIcon } from "lucide-react";
import { StatCounter } from "@/components/report/StatCounter";

interface Tile {
  icon: LucideIcon;
  value: number;
  label: string;
  hint: string;
  tone: "cavity" | "accent";
}

export interface StatTotals {
  reports: number;
  complaints: number;
  gaps: number;
  adAssets: number;
}

/** Four totals across every saved report, each with a plain-language hint. */
export function StatTiles({ totals }: { totals: StatTotals }) {
  const tiles: Tile[] = [
    { icon: Layers, value: totals.reports, label: "Saved reports", hint: "Products you've analyzed and kept", tone: "accent" },
    { icon: MessageSquareWarning, value: totals.complaints, label: "Complaints found", hint: "Things customers are unhappy about", tone: "cavity" },
    { icon: Lightbulb, value: totals.gaps, label: "Market gaps", hint: "Needs nobody is meeting yet", tone: "accent" },
    { icon: Megaphone, value: totals.adAssets, label: "Ad ideas ready", hint: "Angles, hooks and scripts to test", tone: "accent" },
  ];

  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map(({ icon: Icon, value, label, hint, tone }) => (
        <div key={label} className="rounded-3xl border border-border bg-surface/70 p-5 sm:p-6">
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-full ${
              tone === "cavity" ? "bg-cavity-muted text-cavity" : "bg-accent-muted text-accent-ink"
            }`}
          >
            <Icon className="h-4 w-4" />
          </span>
          <div className="mt-4">
            <StatCounter value={value} label={label} />
          </div>
          <p className="mt-2 text-sm leading-snug text-muted">{hint}</p>
        </div>
      ))}
    </dl>
  );
}
