"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Check, ChevronDown, Copy, Pin, RotateCw, Trash2 } from "lucide-react";
import { relativeDate, type ReportSummary } from "@/lib/report-summary";

interface ReportCardProps {
  report: ReportSummary;
  view: "list" | "grid";
  maxCount: number;
  selected: boolean;
  pinned: boolean;
  onSelect: () => void;
  onPin: () => void;
  onCopy: () => void;
  onDelete: () => void;
}

function Meter({ label, value, max, tone }: { label: string; value: number; max: number; tone: "cavity" | "accent" }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-baseline justify-between gap-2 text-xs text-muted">
        <span className="truncate">{label}</span>
        <span className="tabular-nums text-foreground">{value}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-border">
        <div
          className={`h-full rounded-full ${tone === "cavity" ? "bg-cavity" : "bg-accent"}`}
          style={{ width: `${max ? Math.max(value ? 8 : 0, (value / max) * 100) : 0}%` }}
        />
      </div>
    </div>
  );
}

const iconButton =
  "rounded-full p-2 text-muted transition-colors hover:bg-accent-muted hover:text-foreground focus-visible:bg-accent-muted";

export function ReportCard({ report, view, maxCount, selected, pinned, onSelect, onPin, onCopy, onDelete }: ReportCardProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const grid = view === "grid";

  const copy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 380, damping: 36 }}
      className={
        grid
          ? `flex flex-col rounded-3xl border p-5 transition-colors ${
              selected ? "border-accent bg-accent-muted/50" : "border-border bg-surface hover:border-foreground/30"
            }`
          : `border-t border-border py-5 transition-colors sm:px-3 ${selected ? "bg-accent-muted/50" : "hover:bg-accent-muted/25"}`
      }
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onSelect}
          aria-label={`Select ${report.name}`}
          className="mt-2 h-4 w-4 shrink-0 cursor-pointer accent-[var(--accent)]"
        />
        <Link href={`/dashboard/report/${report.id}`} className="group min-w-0 flex-1">
          <span className="flex items-center gap-2">
            {pinned && <Pin className="h-4 w-4 shrink-0 fill-accent text-accent" aria-label="Pinned" />}
            <span className="display truncate text-2xl capitalize leading-tight group-hover:text-accent-ink sm:text-3xl">
              {report.name}
            </span>
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-x-3 text-sm text-muted">
            <span>{relativeDate(report.createdAt)}</span>
            {report.hasAds && (
              <span className="rounded-full bg-accent-muted px-2 py-0.5 text-xs font-medium text-accent-ink">
                Includes ad content
              </span>
            )}
          </span>
        </Link>
      </div>

      <div className={`mt-4 flex gap-4 ${grid ? "" : "sm:pl-7"}`}>
        <Meter label="Complaints" value={report.complaints} max={maxCount} tone="cavity" />
        <Meter label="Gaps" value={report.gaps} max={maxCount} tone="accent" />
        <Meter label="Strategies" value={report.strategies} max={maxCount} tone="accent" />
      </div>

      <div className={`mt-3 flex items-center justify-between gap-2 ${grid ? "" : "sm:pl-7"}`}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-full px-1 py-1 text-sm font-medium text-accent-ink hover:underline"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
          {open ? "Hide preview" : "Quick preview"}
        </button>
        <div className="flex items-center">
          <Link href={`/analyze?q=${encodeURIComponent(report.name)}`} className={iconButton} aria-label={`Run ${report.name} again`} title="Run again">
            <RotateCw className="h-4 w-4" />
          </Link>
          <button type="button" onClick={onPin} aria-pressed={pinned} aria-label={pinned ? "Unpin" : "Pin to top"} title={pinned ? "Unpin" : "Pin to top"} className={iconButton}>
            <Pin className={`h-4 w-4 ${pinned ? "fill-accent text-accent" : ""}`} />
          </button>
          <button type="button" onClick={copy} aria-label="Copy report as text" title="Copy report" className={iconButton}>
            {copied ? <Check className="h-4 w-4 text-accent-ink" /> : <Copy className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Delete ${report.name}`}
            title="Delete"
            className="rounded-full p-2 text-muted transition-colors hover:bg-cavity-muted hover:text-cavity focus-visible:bg-cavity-muted"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {open && (
        <motion.dl
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className={`overflow-hidden ${grid ? "" : "sm:pl-7"}`}
        >
          <div className="mt-3 space-y-3 border-t border-border pt-4 text-sm leading-relaxed">
            {[
              ["Top complaint", report.topComplaint, "text-cavity"],
              ["Biggest gap", report.topGap, "text-accent-ink"],
              ["Best way in", report.topStrategy, "text-accent-ink"],
            ].map(([label, text, tone]) =>
              text ? (
                <div key={label}>
                  <dt className={`font-semibold ${tone}`}>{label}</dt>
                  <dd className="mt-0.5 text-muted">{text}</dd>
                </div>
              ) : null
            )}
            <Link href={`/dashboard/report/${report.id}`} className="inline-block font-medium text-accent-ink hover:underline">
              Open the full report
            </Link>
          </div>
        </motion.dl>
      )}
    </motion.li>
  );
}
