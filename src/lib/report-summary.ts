import { parseSection } from "@/lib/report-metrics";
import { asReportData } from "@/lib/report-data";
import type { Database } from "@/types/database.types";

type ReportRow = Database["public"]["Tables"]["reports"]["Row"];

export interface ReportSummary {
  id: string;
  row: ReportRow;
  name: string;
  createdAt: number;
  complaints: number;
  gaps: number;
  strategies: number;
  topComplaint?: string;
  topGap?: string;
  topStrategy?: string;
  hasAds: boolean;
  url?: string;
}

const plain = (text?: string) => text?.replace(/\*\*/g, "");

/** Counts and highlights read straight from a saved report; nothing is estimated. */
export function summarize(row: ReportRow): ReportSummary {
  const data = asReportData(row.market_data);
  const complaints = parseSection(data.analysis, "NEGATIVE POINTS");
  const gaps = parseSection(data.analysis, "MARKET GAPS");
  const strategies = parseSection(data.analysis, "ENTRY STRATEGIES");
  return {
    id: row.id,
    row,
    name: row.product_name,
    createdAt: new Date(row.created_at).getTime(),
    complaints: complaints.length,
    gaps: gaps.length,
    strategies: strategies.length,
    topComplaint: plain(complaints[0]),
    topGap: plain(gaps[0]),
    topStrategy: plain(strategies[0]),
    hasAds: !!(data.ad_angles?.length || data.hooks?.length || data.scripts?.length),
    url: data.url || undefined,
  };
}

/** Monday 00:00 (local) of the week containing `ts`. */
export function weekStart(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.getTime();
}

export function relativeDate(ts: number): string {
  const days = Math.round((ts - Date.now()) / 86_400_000);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  if (Math.abs(days) < 1) return "Today";
  if (Math.abs(days) < 30) return rtf.format(days, "day");
  if (Math.abs(days) < 365) return rtf.format(Math.round(days / 30), "month");
  return rtf.format(Math.round(days / 365), "year");
}
