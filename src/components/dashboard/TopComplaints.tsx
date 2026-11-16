"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export interface ComplaintRow {
  reportId: string;
  product: string;
  title: string;
  /** Present when the report grouped customer quotes; absent for written-only complaints. */
  mentions?: number;
}

/** The complaints that came up most across all saved reports. Each row opens its report. */
export function TopComplaints({ rows }: { rows: ComplaintRow[] }) {
  const [grown, setGrown] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const counted = rows.some((r) => typeof r.mentions === "number");
  const max = Math.max(1, ...rows.map((r) => r.mentions ?? 0));

  return (
    <div className="rounded-3xl border border-border bg-surface/70 p-5 sm:p-6">
      <h2 className="font-semibold">{counted ? "Complaints that came up most" : "Top complaint from each report"}</h2>
      <p className="mt-1 text-sm text-muted">
        {counted ? "Across your saved reports. Longer bars mean more mentions." : "The first thing customers complain about in each report."}
      </p>
      <ul className="mt-5 space-y-1">
        {rows.map((row, i) => {
          const pct = counted ? Math.max(8, Math.round(((row.mentions ?? 0) / max) * 100)) : 0;
          return (
            <li key={`${row.reportId}-${i}`}>
              <Link
                href={`/dashboard/report/${row.reportId}`}
                className="group block rounded-2xl px-3 py-3 transition-colors hover:bg-cavity-muted/50"
              >
                <span className="flex items-baseline justify-between gap-4">
                  <span className="min-w-0 truncate font-medium group-hover:text-cavity">{row.title}</span>
                  {typeof row.mentions === "number" && (
                    <span className="shrink-0 text-sm tabular-nums text-cavity">{row.mentions}×</span>
                  )}
                </span>
                <span className="mt-0.5 block truncate text-sm capitalize text-muted">{row.product}</span>
                {counted && (
                  <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-border">
                    <span
                      className="block h-full rounded-full bg-cavity transition-[width] duration-[900ms] ease-out"
                      style={{ width: grown ? `${pct}%` : "0%", transitionDelay: `${i * 70}ms` }}
                    />
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
