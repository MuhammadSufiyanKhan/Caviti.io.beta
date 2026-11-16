"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { AnalyzeForm } from "@/components/site/AnalyzeForm";
import {
  clearPendingReport,
  persistReport,
  readPendingReport,
} from "@/lib/pending-report";
import { parseSection } from "@/lib/report-metrics";
import type { Database } from "@/types/database.types";

type Report = Database["public"]["Tables"]["reports"]["Row"];

function gapCount(report: Report): number {
  const analysis = (report.market_data as { analysis?: unknown } | null)
    ?.analysis;
  return typeof analysis === "string"
    ? parseSection(analysis, "MARKET GAPS").length
    : 0;
}

export default function DashboardPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState<string | null>(null); // report id or "all"
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // A report saved just before signing in is waiting in this browser.
      const pending = readPendingReport();
      if (pending) {
        const id = await persistReport(pending);
        if (id) {
          clearPendingReport();
          setNotice(`Saved “${pending.product_name}” to your dashboard.`);
        } else {
          setError(
            "We couldn't save your last report. Run it again and use the save switch.",
          );
        }
      }

      const { data, error: loadError } = await supabase
        .from("reports")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (cancelled) return;
      if (loadError)
        setError("We couldn't load your reports. Refresh to try again.");
      else setReports(data ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const remove = async (target: string) => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(
        target === "all" ? "/api/reports" : `/api/reports/${target}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error();
      setReports((prev) =>
        target === "all" ? [] : prev.filter((r) => r.id !== target),
      );
      setConfirming(null);
    } catch {
      setError("We couldn't delete that. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="display text-[clamp(3rem,8vw,6.5rem)]">
        Your reports
      </h1>
      <p className="mt-3 text-muted">
        Everything you&apos;ve saved, newest first.
      </p>

      <div className="mt-8">
        <AnalyzeForm size="md" buttonLabel="Analyze a product" />
      </div>

      {notice && (
        <p
          role="status"
          className="mt-6 rounded-lg border border-accent/30 bg-accent-muted px-4 py-3 text-sm text-accent-ink"
        >
          {notice}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="mt-6 rounded-lg border border-cavity/30 bg-cavity-muted px-4 py-3 text-sm text-cavity"
        >
          {error}
        </p>
      )}

      <section className="mt-12" aria-live="polite">
        {loading ? (
          <p className="flex items-center gap-2 text-muted">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading your reports…
          </p>
        ) : reports.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-10 text-center">
            <h2 className="display text-3xl">
              No saved reports yet
            </h2>
            <p className="mx-auto mt-2 max-w-md text-muted">
              Analyze a product, then turn on “Save report” and it will show up
              here.
            </p>
            <Link
              href="/analyze"
              className="mt-6 inline-flex h-12 items-center rounded-full bg-accent px-6 text-sm font-medium text-on-accent hover:brightness-110"
            >
              Analyze your first product
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between text-sm text-muted">
              <span>
                {reports.length} saved{" "}
                {reports.length === 1 ? "report" : "reports"}
              </span>
              {confirming === "all" ? (
                <span className="flex items-center gap-3">
                  Delete all reports?
                  <button
                    onClick={() => remove("all")}
                    disabled={busy}
                    className="font-medium text-cavity hover:underline"
                  >
                    Yes, delete all
                  </button>
                  <button
                    onClick={() => setConfirming(null)}
                    className="hover:text-foreground"
                  >
                    Cancel
                  </button>
                </span>
              ) : (
                <button
                  onClick={() => setConfirming("all")}
                  className="hover:text-foreground"
                >
                  Delete all
                </button>
              )}
            </div>
            <ul className="border-b border-border">
              {reports.map((report) => (
                <li
                  key={report.id}
                  className="flex items-center gap-4 border-t border-border py-5"
                >
                  <Link
                    href={`/dashboard/report/${report.id}`}
                    className="group min-w-0 flex-1"
                  >
                    <span className="block truncate display text-3xl capitalize leading-tight group-hover:text-accent-ink sm:text-4xl">
                      {report.product_name}
                    </span>
                    <span className="mt-1 block text-sm text-muted">
                      {new Date(report.created_at).toLocaleDateString(
                        undefined,
                        { year: "numeric", month: "long", day: "numeric" },
                      )}
                      {gapCount(report) > 0 &&
                        `, ${gapCount(report)} market gaps`}
                    </span>
                  </Link>
                  {confirming === report.id ? (
                    <span className="flex shrink-0 items-center gap-3 text-sm">
                      <button
                        onClick={() => remove(report.id)}
                        disabled={busy}
                        className="font-medium text-cavity hover:underline"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setConfirming(null)}
                        className="text-muted hover:text-foreground"
                      >
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button
                      onClick={() => setConfirming(report.id)}
                      aria-label={`Delete report for ${report.product_name}`}
                      className="shrink-0 rounded-md p-2 text-muted hover:bg-cavity-muted hover:text-cavity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </main>
  );
}
