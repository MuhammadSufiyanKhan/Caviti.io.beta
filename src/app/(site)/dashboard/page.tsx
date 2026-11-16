"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { LayoutGrid, List, Search, Sparkles, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { AnalyzeForm } from "@/components/site/AnalyzeForm";
import { Reveal } from "@/components/site/Reveal";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";
import { ReportCard } from "@/components/dashboard/ReportCard";
import { StatTiles } from "@/components/dashboard/StatTiles";
import { TopComplaints, type ComplaintRow } from "@/components/dashboard/TopComplaints";
import { clearPendingReport, persistReport, readPendingReport } from "@/lib/pending-report";
import { copyText } from "@/lib/copy";
import { asReportData } from "@/lib/report-data";
import { reportToMarkdown } from "@/lib/report-markdown";
import { summarize, weekStart, type ReportSummary } from "@/lib/report-summary";
import { useLocalStorage } from "@/lib/use-local-storage";
import type { Database } from "@/types/database.types";

type Report = Database["public"]["Tables"]["reports"]["Row"];
type Sort = "newest" | "oldest" | "gaps" | "name";
type Filter = "all" | "ads" | "pinned";

const NO_PINS: string[] = [];

const SORTS: { value: Sort; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "gaps", label: "Most market gaps" },
  { value: "name", label: "A to Z" },
];

const weekLabel = (ts: number) => new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });

const markdownOf = (r: ReportSummary) =>
  reportToMarkdown({ product_name: r.name, market_data: asReportData(r.row.market_data) });

/** Most-mentioned complaint themes across reports; falls back to each report's first written complaint. */
function buildComplaintRows(summaries: ReportSummary[]): ComplaintRow[] {
  const counted: ComplaintRow[] = [];
  for (const s of summaries) {
    for (const t of asReportData(s.row.market_data).complaint_themes ?? []) {
      if (t.theme && typeof t.mentions === "number" && t.mentions > 0) {
        counted.push({ reportId: s.id, product: s.name, title: t.theme, mentions: t.mentions });
      }
    }
  }
  if (counted.length > 0) return counted.sort((a, b) => (b.mentions ?? 0) - (a.mentions ?? 0)).slice(0, 6);

  const fallback: ComplaintRow[] = [];
  for (const s of summaries) {
    if (s.topComplaint) fallback.push({ reportId: s.id, product: s.name, title: s.topComplaint });
    if (fallback.length === 6) break;
  }
  return fallback;
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-6" role="status" aria-label="Loading your reports">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-40 rounded-3xl bg-border/60" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="h-72 rounded-3xl bg-border/60 lg:col-span-3" />
        <div className="h-72 rounded-3xl bg-border/60 lg:col-span-2" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [firstName, setFirstName] = useState("");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  // Library controls
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("newest");
  const [filter, setFilter] = useState<Filter>("all");
  const [week, setWeek] = useState<number | null>(null);
  const [view, setView] = useLocalStorage<"grid" | "list">("caviti:dashboard-view", "grid");
  const [pinned, setPinned] = useLocalStorage<string[]>("caviti:pinned-reports", NO_PINS);
  const [selected, setSelected] = useState<string[]>([]);
  const [toDelete, setToDelete] = useState<string[] | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [bulkCopied, setBulkCopied] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const meta = user.user_metadata as { first_name?: string } | undefined;
      setFirstName(meta?.first_name?.trim() || "");

      // A report saved just before signing in is waiting in this browser.
      const pending = readPendingReport();
      if (pending) {
        const id = await persistReport(pending);
        if (id) {
          clearPendingReport();
          setNotice(`Saved “${pending.product_name}” to your dashboard.`);
        } else {
          setError("We couldn't save your last report. Run it again and use the save switch.");
        }
      }

      const { data, error: loadError } = await supabase
        .from("reports")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (cancelled) return;
      if (loadError) setError("We couldn't load your reports. Refresh to try again.");
      else setReports(data ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Press "/" anywhere to jump to search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const summaries = useMemo(() => reports.map(summarize), [reports]);

  const totals = useMemo(() => {
    let adAssets = 0;
    summaries.forEach((s) => {
      const d = asReportData(s.row.market_data);
      adAssets += (d.ad_angles?.length ?? 0) + (d.hooks?.length ?? 0) + (d.scripts?.length ?? 0);
    });
    return {
      reports: summaries.length,
      complaints: summaries.reduce((n, s) => n + s.complaints, 0),
      gaps: summaries.reduce((n, s) => n + s.gaps, 0),
      adAssets,
    };
  }, [summaries]);

  const complaintRows = useMemo(() => buildComplaintRows(summaries), [summaries]);

  const standout = useMemo(() => {
    const top = complaintRows.find((r) => typeof r.mentions === "number");
    if (top) {
      return (
        <>
          <strong className="font-semibold">“{top.title}”</strong> is the complaint you&apos;ve seen most often:{" "}
          {top.mentions} mentions in <span className="capitalize">{top.product}</span>.
        </>
      );
    }
    const latest = summaries[0];
    if (latest && latest.gaps > 0) {
      return (
        <>
          Your latest report, <span className="capitalize">{latest.name}</span>, found{" "}
          <strong className="font-semibold">{latest.gaps} market gaps</strong> worth a look.
        </>
      );
    }
    return null;
  }, [complaintRows, summaries]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = summaries.filter((s) => {
      if (q && !s.name.toLowerCase().includes(q)) return false;
      if (filter === "ads" && !s.hasAds) return false;
      if (filter === "pinned" && !pinned.includes(s.id)) return false;
      if (week !== null && weekStart(s.createdAt) !== week) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sort === "oldest") return a.createdAt - b.createdAt;
      if (sort === "gaps") return b.gaps - a.gaps || b.createdAt - a.createdAt;
      if (sort === "name") return a.name.localeCompare(b.name);
      return b.createdAt - a.createdAt;
    });
    // Pinned reports stay on top, in the chosen order.
    return [...list.filter((s) => pinned.includes(s.id)), ...list.filter((s) => !pinned.includes(s.id))];
  }, [summaries, query, filter, week, sort, pinned]);

  const maxCount = useMemo(
    () => Math.max(1, ...visible.flatMap((s) => [s.complaints, s.gaps, s.strategies])),
    [visible]
  );

  const recent = summaries.slice(0, 4);
  const filtering = query.trim() !== "" || filter !== "all" || week !== null;
  const selectedVisible = selected.filter((id) => visible.some((s) => s.id === id));
  const allShownSelected = visible.length > 0 && selectedVisible.length === visible.length;

  const toggleSelect = useCallback(
    (id: string) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])),
    []
  );
  const togglePin = (id: string) => setPinned(pinned.includes(id) ? pinned.filter((x) => x !== id) : [...pinned, id]);
  const clearFilters = () => {
    setQuery("");
    setFilter("all");
    setWeek(null);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    setError("");
    const results = await Promise.allSettled(
      toDelete.map((id) =>
        fetch(`/api/reports/${id}`, { method: "DELETE" }).then((res) => {
          if (!res.ok) throw new Error(id);
          return id;
        })
      )
    );
    const removed = results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
    setReports((prev) => prev.filter((r) => !removed.includes(r.id)));
    setSelected((prev) => prev.filter((id) => !removed.includes(id)));
    setPinned(pinned.filter((id) => !removed.includes(id)));
    if (removed.length < toDelete.length) {
      setError(`We couldn't delete ${toDelete.length - removed.length} of ${toDelete.length}. Try again.`);
    } else {
      setNotice(removed.length === 1 ? "Report deleted." : `${removed.length} reports deleted.`);
    }
    setDeleting(false);
    setToDelete(null);
  };

  const copySelected = async () => {
    const text = summaries
      .filter((s) => selectedVisible.includes(s.id))
      .map(markdownOf)
      .join("\n---\n\n");
    if (await copyText(text)) {
      setBulkCopied(true);
      setTimeout(() => setBulkCopied(false), 1800);
    }
  };

  const deleteTarget = toDelete ? summaries.filter((s) => toDelete.includes(s.id)) : [];

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <Reveal>
        <h1 className="display text-[clamp(2.8rem,7vw,5.5rem)]">
          {firstName ? `Welcome back, ${firstName}` : "Your reports"}
        </h1>
        <p className="mt-3 max-w-xl text-lg text-muted">
          {loading
            ? "Getting your reports ready."
            : summaries.length > 0
              ? "Here's what everything you've saved adds up to. Open any report to dig in."
              : "Reports you save will show up here."}
        </p>
      </Reveal>

      <div className="mt-8 max-w-2xl">
        <AnalyzeForm size="md" buttonLabel="Analyze a product" />
        {recent.length > 0 && (
          <p className="mt-4 text-sm text-muted">
            Run again:{" "}
            {recent.map((r, i) => (
              <span key={r.id}>
                <Link
                  href={`/analyze?q=${encodeURIComponent(r.name)}`}
                  className="capitalize text-foreground underline decoration-border decoration-2 underline-offset-4 hover:decoration-accent"
                >
                  {r.name}
                </Link>
                {i < recent.length - 1 ? ", " : ""}
              </span>
            ))}
          </p>
        )}
      </div>

      {notice && (
        <p
          role="status"
          className="mt-6 flex items-start justify-between gap-4 rounded-2xl border border-accent/30 bg-accent-muted px-4 py-3 text-sm text-accent-ink"
        >
          {notice}
          <button onClick={() => setNotice("")} aria-label="Dismiss" className="shrink-0 hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </p>
      )}
      {error && (
        <p role="alert" className="mt-6 rounded-2xl border border-cavity/30 bg-cavity-muted px-4 py-3 text-sm text-cavity">
          {error}
        </p>
      )}

      <div className="mt-12">
        {loading ? (
          <Skeleton />
        ) : summaries.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-10 text-center">
            <h2 className="display text-3xl">No saved reports yet</h2>
            <p className="mx-auto mt-2 max-w-md text-muted">
              Analyze a product, then turn on “Save report”. It will show up here with its complaints, gaps and ad
              ideas.
            </p>
            <Link
              href="/analyze"
              className="mt-6 inline-flex h-12 items-center rounded-full bg-accent px-6 text-sm font-medium text-on-accent hover:brightness-110"
            >
              Analyze your first product
            </Link>
          </div>
        ) : (
          <div className="space-y-10">
            <Reveal>
              <StatTiles totals={totals} />
            </Reveal>

            {standout && (
              <Reveal>
                <p className="flex items-start gap-3 rounded-3xl border border-accent/30 bg-accent-muted/60 px-5 py-4 text-lg leading-snug">
                  <Sparkles className="mt-1 h-5 w-5 shrink-0 text-accent-ink" aria-hidden />
                  <span>{standout}</span>
                </p>
              </Reveal>
            )}

            <Reveal className="grid grid-cols-1 gap-4 lg:grid-cols-5">
              <div className="min-w-0 lg:col-span-3">
                {complaintRows.length > 0 && <TopComplaints rows={complaintRows} />}
              </div>
              <div className="min-w-0 lg:col-span-2">
                <ActivityChart dates={summaries.map((s) => s.createdAt)} active={week} onSelect={setWeek} />
              </div>
            </Reveal>

            {/* Library */}
            <section aria-labelledby="library-title">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <h2 id="library-title" className="display text-[clamp(2rem,4.5vw,3.5rem)]">
                  Your reports
                </h2>
                <div className="flex items-center gap-1 rounded-full border border-border p-1" role="group" aria-label="Layout">
                  {(
                    [
                      ["grid", LayoutGrid, "Grid view"],
                      ["list", List, "List view"],
                    ] as const
                  ).map(([value, Icon, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setView(value)}
                      aria-pressed={view === value}
                      aria-label={label}
                      title={label}
                      className={`rounded-full p-2 ${
                        view === value ? "bg-foreground text-background" : "text-muted hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <label className="relative min-w-[200px] flex-1 sm:max-w-xs">
                  <span className="sr-only">Search your reports</span>
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    ref={searchRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search reports"
                    className="h-11 w-full rounded-full border border-border bg-surface/80 pl-10 pr-10 text-sm placeholder:text-muted/70 focus:border-accent focus:outline-none"
                  />
                  {query ? (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      aria-label="Clear search"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : (
                    <kbd className="pointer-events-none absolute right-3.5 top-1/2 hidden -translate-y-1/2 rounded border border-border px-1.5 text-xs text-muted sm:block">
                      /
                    </kbd>
                  )}
                </label>

                <div className="flex gap-1.5" role="group" aria-label="Filter">
                  {(
                    [
                      ["all", "All"],
                      ["ads", "With ad ideas"],
                      ["pinned", "Pinned"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={filter === value}
                      onClick={() => setFilter(value)}
                      className={`rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
                        filter === value
                          ? "border-foreground bg-foreground text-background"
                          : "border-border text-muted hover:text-foreground"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <label className="ml-auto text-sm text-muted">
                  <span className="sr-only">Sort reports</span>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as Sort)}
                    className="h-11 rounded-full border border-border bg-surface/80 px-4 text-sm text-foreground focus:border-accent focus:outline-none"
                  >
                    {SORTS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {week !== null && (
                <p className="mt-3 text-sm text-muted">
                  Showing reports from the week of {weekLabel(week)}.{" "}
                  <button onClick={() => setWeek(null)} className="font-medium text-accent-ink hover:underline">
                    Show all weeks
                  </button>
                </p>
              )}

              {/* Bulk actions */}
              <div className="mt-4 flex min-h-10 flex-wrap items-center gap-x-4 gap-y-2 text-sm" aria-live="polite">
                <label className="flex cursor-pointer items-center gap-2 text-muted">
                  <input
                    type="checkbox"
                    checked={allShownSelected}
                    onChange={() => setSelected(allShownSelected ? [] : visible.map((s) => s.id))}
                    disabled={visible.length === 0}
                    className="h-4 w-4 cursor-pointer accent-[var(--accent)]"
                  />
                  Select all shown
                </label>
                {selectedVisible.length > 0 ? (
                  <>
                    <span className="font-medium">{selectedVisible.length} selected</span>
                    <button
                      onClick={copySelected}
                      className="rounded-full border border-border px-3.5 py-1.5 font-medium hover:border-foreground/40"
                    >
                      {bulkCopied ? "Copied" : "Copy as text"}
                    </button>
                    <button
                      onClick={() => setToDelete(selectedVisible)}
                      className="rounded-full border border-cavity/40 px-3.5 py-1.5 font-medium text-cavity hover:bg-cavity-muted"
                    >
                      Delete selected
                    </button>
                    <button onClick={() => setSelected([])} className="text-muted hover:text-foreground">
                      Clear
                    </button>
                  </>
                ) : (
                  <span className="text-muted">
                    Showing {visible.length} of {summaries.length}
                  </span>
                )}
              </div>

              {visible.length === 0 ? (
                <div className="mt-6 rounded-3xl border border-dashed border-border p-10 text-center">
                  <h3 className="display text-3xl">Nothing matches</h3>
                  <p className="mt-2 text-muted">
                    {filter === "pinned" && !query && week === null
                      ? "Pin a report with the pin icon on its card and it will show here."
                      : "No report fits those filters."}
                  </p>
                  {filtering && (
                    <button
                      onClick={clearFilters}
                      className="mt-5 rounded-full border border-border px-5 py-2.5 text-sm font-medium hover:border-foreground/40"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              ) : (
                <ul
                  className={
                    view === "grid" ? "mt-4 grid grid-cols-1 gap-4 md:grid-cols-2" : "mt-4 border-b border-border"
                  }
                >
                  <AnimatePresence>
                    {visible.map((report) => (
                      <ReportCard
                        key={report.id}
                        report={report}
                        view={view}
                        maxCount={maxCount}
                        selected={selected.includes(report.id)}
                        pinned={pinned.includes(report.id)}
                        onSelect={() => toggleSelect(report.id)}
                        onPin={() => togglePin(report.id)}
                        onCopy={() => void copyText(markdownOf(report))}
                        onDelete={() => setToDelete([report.id])}
                      />
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </section>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={toDelete !== null}
        title={deleteTarget.length > 1 ? `Delete ${deleteTarget.length} reports?` : "Delete this report?"}
        body={
          deleteTarget.length === 1
            ? `“${deleteTarget[0].name}” will be removed from your dashboard. This can't be undone.`
            : "These reports will be removed from your dashboard. This can't be undone."
        }
        confirmLabel={deleteTarget.length > 1 ? "Delete reports" : "Delete report"}
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => (deleting ? undefined : setToDelete(null))}
      />
    </main>
  );
}
