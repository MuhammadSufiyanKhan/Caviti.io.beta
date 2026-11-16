"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { ReportView } from "@/components/report/ReportView";
import { useEnrichedReport } from "@/components/report/useEnrichedReport";
import { asReportData, type GuestReport } from "@/lib/report-data";

export default function SavedReportPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [saved, setSaved] = useState<{ report: GuestReport; createdAt: string } | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");
  const [removing, setRemoving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    createClient()
      .from("reports")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        if (cancelled) return;
        if (!data) {
          setState("missing");
          return;
        }
        setSaved({
          createdAt: data.created_at,
          report: { product_name: data.product_name, market_data: asReportData(data.market_data) },
        });
        setState("ready");
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const base = useMemo(() => saved?.report ?? null, [saved]);
  const { report, themesLoading, adsLoading } = useEnrichedReport(base);

  const remove = async () => {
    setRemoving(true);
    setError("");
    try {
      const res = await fetch(`/api/reports/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.push("/dashboard");
    } catch {
      setError("We couldn't delete this report. Try again.");
      setRemoving(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <Link href="/dashboard" className="mb-8 inline-flex items-center gap-2 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to your reports
      </Link>

      {state === "loading" && (
        <p className="flex items-center gap-2 text-muted" role="status">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading report…
        </p>
      )}

      {state === "missing" && (
        <div>
          <h1 className="display text-4xl">We couldn&apos;t find that report</h1>
          <p className="mt-2 text-muted">It may have been deleted, or it belongs to a different account.</p>
        </div>
      )}

      {state === "ready" && report && saved && (
        <ReportView
          report={report}
          themesLoading={themesLoading}
          adsLoading={adsLoading}
          dateLabel={new Date(saved.createdAt).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
          actions={
            <div>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <span className="inline-flex items-center gap-2 rounded-full bg-accent-muted px-3 py-1.5 font-medium text-accent-ink">
                  <Check className="h-4 w-4" /> Saved to your dashboard
                </span>
                {confirming ? (
                  <span className="flex items-center gap-3">
                    Delete this report?
                    <button onClick={remove} disabled={removing} className="font-medium text-cavity hover:underline">
                      {removing ? "Deleting…" : "Yes, delete"}
                    </button>
                    <button onClick={() => setConfirming(false)} className="text-muted hover:text-foreground">Cancel</button>
                  </span>
                ) : (
                  <button onClick={() => setConfirming(true)} className="text-muted hover:text-cavity">
                    Delete report
                  </button>
                )}
              </div>
              {error && <p role="alert" className="mt-2 text-sm text-cavity">{error}</p>}
            </div>
          }
        />
      )}
    </main>
  );
}
