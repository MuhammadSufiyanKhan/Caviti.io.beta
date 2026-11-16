"use client";

import { useEffect, useMemo, useState } from "react";
import { weekStart } from "@/lib/report-summary";

const WEEKS = 8;

interface ActivityChartProps {
  dates: number[];
  active: number | null;
  onSelect: (weekStartTs: number | null) => void;
}

const label = (ts: number) => new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });

/** Reports saved per week for the last eight weeks. Click a bar to filter the list to that week. */
export function ActivityChart({ dates, active, onSelect }: ActivityChartProps) {
  const [grown, setGrown] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  // Read the clock once, on first render, so the chart is stable between renders.
  const [now] = useState(() => Date.now());

  useEffect(() => {
    const frame = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const weeks = useMemo(() => {
    const start = new Date(weekStart(now));
    const list = Array.from({ length: WEEKS }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() - 7 * (WEEKS - 1 - i));
      return { start: d.getTime(), count: 0 };
    });
    dates.forEach((ts) => {
      const w = weekStart(ts);
      const hit = list.find((x) => x.start === w);
      if (hit) hit.count += 1;
    });
    return list;
  }, [dates, now]);

  const max = Math.max(1, ...weeks.map((w) => w.count));
  const shown = hover ?? active;
  const shownWeek = weeks.find((w) => w.start === shown);

  return (
    <div className="rounded-3xl border border-border bg-surface/70 p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-semibold">Reports saved per week</h2>
        <p className="min-h-5 text-sm text-muted" aria-live="polite">
          {shownWeek
            ? `Week of ${label(shownWeek.start)}: ${shownWeek.count} ${shownWeek.count === 1 ? "report" : "reports"}`
            : "Click a week to filter your list"}
        </p>
      </div>
      <div className="mt-5 flex h-28 items-end gap-2 sm:gap-3">
        {weeks.map((week, i) => {
          const on = active === week.start;
          const pct = week.count === 0 ? 4 : Math.max(14, (week.count / max) * 100);
          return (
            <button
              key={week.start}
              type="button"
              aria-pressed={on}
              aria-label={`Week of ${label(week.start)}, ${week.count} reports`}
              onClick={() => onSelect(on ? null : week.start)}
              onMouseEnter={() => setHover(week.start)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(week.start)}
              onBlur={() => setHover(null)}
              className="group flex h-full flex-1 flex-col justify-end rounded-lg"
            >
              <span
                className={`block w-full rounded-md transition-[height,background-color] duration-700 ease-out ${
                  on
                    ? "bg-accent"
                    : week.count === 0
                      ? "bg-border"
                      : "bg-accent/45 group-hover:bg-accent/80"
                }`}
                style={{ height: grown ? `${pct}%` : "4%", transitionDelay: `${i * 50}ms` }}
              />
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex gap-2 text-xs text-muted sm:gap-3">
        {weeks.map((w, i) => (
          // On narrow screens only every other label shows, so none are cut off.
          <span
            key={w.start}
            className={`min-w-0 flex-1 whitespace-nowrap text-center sm:truncate ${
              i % 2 === 1 ? "max-sm:invisible max-sm:overflow-hidden" : "max-sm:overflow-visible"
            }`}
          >
            {label(w.start)}
          </span>
        ))}
      </div>
    </div>
  );
}
