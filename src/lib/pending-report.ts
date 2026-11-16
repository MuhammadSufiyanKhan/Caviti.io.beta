import type { GuestReport } from "@/lib/report-data";

const KEY = "caviti:pending-report";

/** A report a visitor asked to save before signing in. Survives the sign-in redirect. */
export function stashPendingReport(report: GuestReport) {
  try {
    localStorage.setItem(KEY, JSON.stringify(report));
  } catch {
    /* storage unavailable: the user can still re-run the analysis */
  }
}

export function readPendingReport(): GuestReport | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GuestReport;
    return parsed?.product_name && parsed?.market_data ? parsed : null;
  } catch {
    return null;
  }
}

export function clearPendingReport() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/** Saves the report via the API. Returns the new report id, or null on failure. */
export async function persistReport(report: GuestReport): Promise<string | null> {
  try {
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(report),
    });
    if (!res.ok) return null;
    const body = await res.json();
    return typeof body?.id === "string" ? body.id : null;
  } catch {
    return null;
  }
}
