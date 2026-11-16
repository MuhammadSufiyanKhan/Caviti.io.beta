"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { AnalyzeForm } from "@/components/site/AnalyzeForm";
import { PointCloudLazy } from "@/components/site/PointCloudLazy";
import { ReportView } from "@/components/report/ReportView";
import { SaveReportToggle } from "@/components/report/SaveReportToggle";
import { useEnrichedReport } from "@/components/report/useEnrichedReport";
import type { GuestReport } from "@/lib/report-data";

const STEPS = [
  "Searching reviews and complaints",
  "Reading what customers say",
  "Writing your report",
];

const cacheKey = (q: string) => `caviti:report:${q.toLowerCase()}`;

function readCache(q: string): GuestReport | null {
  try {
    const raw = sessionStorage.getItem(cacheKey(q));
    return raw ? (JSON.parse(raw) as GuestReport) : null;
  } catch {
    return null;
  }
}

function writeCache(q: string, report: GuestReport) {
  try {
    sessionStorage.setItem(cacheKey(q), JSON.stringify(report));
  } catch {
    /* ignore */
  }
}

export function AnalyzeClient() {
  const q = (useSearchParams().get("q") ?? "").trim();
  // Remounting per query resets all analysis state without manual cleanup.
  return <Analysis key={q} q={q} />;
}

function Analysis({ q }: { q: string }) {
  const [base, setBase] = useState<GuestReport | null>(null);
  const [loading, setLoading] = useState(Boolean(q));
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [savedId, setSavedId] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!q || started.current) return;
    started.current = true;

    // A refresh shouldn't spend another analysis.
    const cached = readCache(q);
    if (cached) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restoring a report cached in sessionStorage, which only exists in the browser
      setBase(cached);
      setLoading(false);
      return;
    }

    const stepTimer = setInterval(() => setStep((s) => Math.min(STEPS.length - 1, s + 1)), 3500);

    (async () => {
      try {
        const res = await fetch("/api/analyze-serpapi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keyword: q }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.error || "The analysis failed. Try again.");
        setBase(body as GuestReport);
      } catch (err) {
        setError(err instanceof Error ? err.message : "The analysis failed. Try again.");
      } finally {
        clearInterval(stepTimer);
        setLoading(false);
      }
    })();
  }, [q]);

  const { report, themesLoading, adsLoading, enriching } = useEnrichedReport(base);

  useEffect(() => {
    if (report && q && !enriching) writeCache(q, report);
  }, [report, q, enriching]);

  const dateLabel = useMemo(
    () => new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }),
    []
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      {!q && (
        <div className="py-10">
          <h1 className="display text-[clamp(2.8rem,7vw,5.5rem)]">
            What do you want to analyze?
          </h1>
          <p className="mt-3 max-w-xl text-muted">
            Enter a product name or a link. You don&apos;t need an account to run an analysis.
          </p>
          <div className="mt-8">
            <AnalyzeForm />
          </div>
        </div>
      )}

      {q && (
        <div className="mb-10">
          <AnalyzeForm initialValue={q} size="md" buttonLabel="Analyze again" />
        </div>
      )}

      {loading && (
        <div className="grid items-center gap-8 py-6 md:grid-cols-[1fr_320px]" role="status" aria-live="polite">
          <div>
            <h1 className="display text-4xl sm:text-5xl">
              Analyzing <span className="capitalize">{q}</span>
            </h1>
            <div className="mt-5 h-1 w-full max-w-md overflow-hidden rounded-full bg-border">
              <div className="h-full w-1/3 rounded-full bg-accent" style={{ animation: "scan 1.6s ease-in-out infinite" }} />
            </div>
            <ol className="mt-6 space-y-3">
              {STEPS.map((label, i) => (
                <li key={label} className={`flex items-center gap-3 text-sm ${i <= step ? "text-foreground" : "text-muted/60"}`}>
                  {i < step ? (
                    <Check className="h-4 w-4 text-accent" />
                  ) : i === step ? (
                    <Loader2 className="h-4 w-4 animate-spin text-accent" />
                  ) : (
                    <span className="h-4 w-4" />
                  )}
                  {label}
                </li>
              ))}
            </ol>
            <p className="mt-6 text-sm text-muted">This usually takes 10 to 20 seconds.</p>
          </div>
          <PointCloudLazy compact className="mx-auto aspect-square w-full max-w-[320px]" />
        </div>
      )}

      {error && !loading && (
        <div role="alert" className="rounded-xl border border-cavity/30 bg-cavity-muted p-5">
          <p className="font-semibold text-cavity">The analysis didn&apos;t finish</p>
          <p className="mt-1 text-sm">{error}</p>
        </div>
      )}

      {report && !loading && (
        <ReportView
          report={report}
          themesLoading={themesLoading}
          adsLoading={adsLoading}
          dateLabel={dateLabel}
          actions={
            <SaveReportToggle
              report={report}
              disabled={enriching}
              savedId={savedId}
              onSavedIdChange={setSavedId}
            />
          }
        />
      )}
    </main>
  );
}
