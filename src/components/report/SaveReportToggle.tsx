"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { AuthModal } from "@/components/auth/AuthModal";
import { clearPendingReport, persistReport, stashPendingReport } from "@/lib/pending-report";
import type { GuestReport } from "@/lib/report-data";

interface SaveReportToggleProps {
  report: GuestReport;
  /** Held back until the report has finished generating, so the saved copy is complete. */
  disabled?: boolean;
  savedId: string | null;
  onSavedIdChange: (id: string | null) => void;
}

export function SaveReportToggle({ report, disabled, savedId, onSavedIdChange }: SaveReportToggleProps) {
  const [busy, setBusy] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [error, setError] = useState("");

  const isOn = savedId !== null;

  const save = async () => {
    setBusy(true);
    setError("");
    const id = await persistReport(report);
    setBusy(false);
    if (id) {
      clearPendingReport();
      onSavedIdChange(id);
    } else {
      setError("We couldn't save this report. Try again.");
    }
  };

  const unsave = async () => {
    if (!savedId) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/reports/${savedId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      onSavedIdChange(null);
    } catch {
      setError("We couldn't remove this report. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const toggle = async () => {
    if (busy || disabled) return;
    if (isOn) return unsave();

    const { data } = await createClient().auth.getUser();
    if (data.user) return save();

    // Visitors can try everything. Saving is what needs an account.
    stashPendingReport(report);
    setAuthOpen(true);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          type="button"
          role="switch"
          aria-checked={isOn}
          aria-label="Save this report to my dashboard"
          disabled={disabled || busy}
          onClick={toggle}
          className="flex items-center gap-3 rounded-full border border-border bg-surface/90 py-1.5 pl-1.5 pr-4 text-sm font-medium hover:border-foreground/30 disabled:opacity-60"
        >
          <span
            className={`relative h-6 w-11 rounded-full transition-colors ${isOn ? "bg-accent" : "bg-border"}`}
            aria-hidden
          >
            <span
              className={`absolute top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-background shadow transition-all ${
                isOn ? "left-[22px]" : "left-0.5"
              }`}
            >
              {busy && <Loader2 className="h-3 w-3 animate-spin text-muted" />}
            </span>
          </span>
          {isOn ? "Saved to your dashboard" : "Save report"}
        </button>

        {isOn && (
          <Link href="/dashboard" className="text-sm font-medium text-accent-ink hover:underline">
            View saved reports
          </Link>
        )}
        {!isOn && disabled && <span className="text-sm text-muted">You can save once the report finishes.</span>}
        {!isOn && !disabled && <span className="text-sm text-muted">Sign in or create a free account to keep it.</span>}
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-cavity">{error}</p>}

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuthenticated={() => {
          setAuthOpen(false);
          save();
        }}
      />
    </div>
  );
}
